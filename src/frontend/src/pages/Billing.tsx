import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  type Bill,
  type BillItem,
  PaymentStatus,
  useAddBill,
  useAddBillPayment,
  useAllBills,
  useClinicSettings,
  useDeleteBill,
  useSearchPatients,
} from "../hooks/useQueries";
import { formatDate, formatRupees, nowNanoseconds } from "../utils/formatters";

const PAGE_SIZE = 10;
const GST_RATES = [0, 5, 12, 18];

const emptyItem = (): BillItem => ({
  name: "",
  quantity: 1,
  rate: 0,
  gstPercent: 0,
  discount: 0,
  amount: 0,
});

export default function Billing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [printBill, setPrintBill] = useState<Bill | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "paid" | "partial"
  >("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // New Bill form
  const [patientId, setPatientId] = useState("");
  const [billDate, setBillDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [items, setItems] = useState<BillItem[]>([emptyItem()]);
  const [enableGST, setEnableGST] = useState(true);
  const [billNotes, setBillNotes] = useState("");
  const [initialPayAmount, setInitialPayAmount] = useState("");
  const [initialPayMode, setInitialPayMode] = useState("Cash");

  // Payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payNotes, setPayNotes] = useState("");

  const { data: patients } = useSearchPatients("");
  const { data: allBills } = useAllBills();
  const { data: settings } = useClinicSettings();
  const addBill = useAddBill();
  // updateBill not needed - using addBillPayment
  const deleteBill = useDeleteBill();
  const addBillPayment = useAddBillPayment();

  useEffect(() => {
    const handler = () => {
      resetForm();
      setModalOpen(true);
    };
    window.addEventListener("shortcut:new-bill", handler);
    return () => window.removeEventListener("shortcut:new-bill", handler);
  }, []);

  const filteredBills = (allBills ?? []).filter((b) => {
    const matchStatus =
      filterStatus === "all" || b.paymentStatus === filterStatus;
    const matchSearch =
      !searchTerm ||
      b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((patients ?? []).find((p) => p.id === b.patientId)?.name ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });
  const paginatedBills = filteredBills.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const totalPages = Math.ceil(filteredBills.length / PAGE_SIZE);
  const patientMap = new Map((patients ?? []).map((p) => [p.id.toString(), p]));

  const calcItem = (item: BillItem): BillItem => {
    const base = item.quantity * item.rate;
    const discounted = base * (1 - (item.discount ?? 0) / 100);
    const gst = enableGST ? (discounted * item.gstPercent) / 100 : 0;
    return { ...item, amount: Math.round((discounted + gst) * 100) / 100 };
  };

  const updatedItems = items.map(calcItem);
  const subtotal = updatedItems.reduce((s, it) => {
    const base = it.quantity * it.rate;
    return s + base * (1 - (it.discount ?? 0) / 100);
  }, 0);
  const gstAmount = enableGST
    ? updatedItems.reduce((s, it) => {
        const discounted =
          it.quantity * it.rate * (1 - (it.discount ?? 0) / 100);
        return s + (discounted * it.gstPercent) / 100;
      }, 0)
    : 0;
  const totalAmount = subtotal + gstAmount;

  const resetForm = () => {
    setPatientId("");
    setBillDate(new Date().toISOString().split("T")[0]);
    setItems([emptyItem()]);
    setEnableGST(true);
    setBillNotes("");
    setInitialPayAmount("");
    setInitialPayMode("Cash");
  };

  const updateItem = (idx: number, patch: Partial<BillItem>) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );

  const handleSubmit = async () => {
    if (!patientId) {
      toast.error("Please select a patient");
      return;
    }
    if (items.every((it) => !it.name)) {
      toast.error("Add at least one item");
      return;
    }
    try {
      const finalItems = updatedItems.filter((it) => it.name);
      const paid = initialPayAmount
        ? Number.parseFloat(initialPayAmount) || 0
        : 0;
      const status: "paid" | "partial" | "pending" =
        paid >= totalAmount ? "paid" : paid > 0 ? "partial" : "pending";
      const billId = await addBill.mutateAsync({
        patientId: BigInt(patientId),
        billDate: nowNanoseconds(),
        items: finalItems,
        subtotal: Math.round(subtotal * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paidAmount: Math.min(paid, totalAmount),
        paymentStatus: status,
        paymentMode: paid > 0 ? initialPayMode : undefined,
        notes: billNotes,
      });
      // Add initial payment record if paid
      if (paid > 0) {
        addBillPayment.mutateAsync({
          billId,
          payment: {
            date: nowNanoseconds(),
            amount: Math.min(paid, totalAmount),
            mode: initialPayMode,
          },
        });
      }
      toast.success("Bill created");
      setModalOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to create bill");
    }
  };

  const handleCollectPayment = async () => {
    if (!selectedBill || !payAmount) return;
    const paid = Number.parseFloat(payAmount);
    if (Number.isNaN(paid) || paid <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await addBillPayment.mutateAsync({
        billId: selectedBill.id,
        payment: {
          date: nowNanoseconds(),
          amount: paid,
          mode: payMode,
          reference: payRef || undefined,
          notes: payNotes || undefined,
        },
      });
      toast.success(`Payment of ${formatRupees(paid)} collected`);
      setPayModalOpen(false);
      setSelectedBill(null);
    } catch {
      toast.error("Failed to collect payment");
    }
  };

  const handlePrint = (b: Bill) => {
    setPrintBill(b);
  };

  useEffect(() => {
    if (!printBill) return;
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    const afterPrint = () => {
      setPrintBill(null);
    };
    window.addEventListener("afterprint", afterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, [printBill]);

  const handleBillPdfDownload = (b: Bill) => {
    const p = patientMap.get(b.patientId.toString());
    const clinicName = settings?.clinicName || "Homeopathy Clinic";
    const itemRows = b.items
      .map(
        (it) =>
          `<tr style="border-bottom:1px solid #ddd"><td style="padding:4px">${it.name}</td><td style="padding:4px;text-align:center">${it.quantity}</td><td style="padding:4px;text-align:right">₹${it.rate.toFixed(2)}</td><td style="padding:4px;text-align:right">${it.discount ?? 0}%</td><td style="padding:4px;text-align:right">${it.gstPercent}%</td><td style="padding:4px;text-align:right">₹${it.amount.toFixed(2)}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><title>Invoice ${b.billNumber}</title><style>body{font-family:Arial,sans-serif;font-size:12pt;padding:20px;color:#000}table{width:100%;border-collapse:collapse}th{border-bottom:2px solid #333;padding:4px;text-align:left}.right{text-align:right}</style></head><body>
      <div style="text-align:center;border-bottom:1px solid #333;padding-bottom:8px;margin-bottom:12px">
        <h2 style="margin:0">${clinicName}</h2>
        <p style="margin:2px 0">${settings?.doctorName ?? ""}</p>
        <p style="margin:2px 0">${settings?.address ?? ""}</p>
        <p style="margin:2px 0">Ph: ${settings?.phone ?? ""}</p>
        ${settings?.gstNumber ? `<p style="margin:2px 0">GSTIN: ${settings.gstNumber}</p>` : ""}
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <div><p><b>Invoice:</b> ${b.billNumber}</p><p><b>Date:</b> ${new Date(Number(b.billDate) / 1000000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>${b.paymentMode ? `<p><b>Payment Mode:</b> ${b.paymentMode}</p>` : ""}</div>
        <div style="text-align:right">${p ? `<p><b>${p.name}</b></p><p>${p.patientCode} | ${p.phone}</p>` : ""}</div>
      </div>
      <table><thead><tr><th>Item</th><th>Qty</th><th class="right">Rate</th><th class="right">Disc%</th><th class="right">GST%</th><th class="right">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
      <div style="text-align:right;margin-top:12px">
        <p>Subtotal: ₹${b.subtotal.toFixed(2)}</p>
        ${b.gstAmount > 0 ? `<p>GST: ₹${b.gstAmount.toFixed(2)}</p>` : ""}
        <p style="font-size:14pt;font-weight:bold">Total: ₹${b.totalAmount.toFixed(2)}</p>
        <p>Paid: ₹${b.paidAmount.toFixed(2)}</p>
        <p>Balance: ₹${(b.totalAmount - b.paidAmount).toFixed(2)}</p>
      </div>
      <p style="text-align:center;font-weight:bold;margin-top:12px">Status: ${b.paymentStatus.toUpperCase()}</p>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        w.print();
        setTimeout(() => w.close(), 500);
      }, 300);
    }
  };

  function downloadCSV(filename: string, rows: string[][]): void {
    const csv = rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleExportBillsCSV = () => {
    const rows: string[][] = [
      ["Invoice#", "Date", "Patient", "Total", "Paid", "Due", "Status"],
    ];
    for (const b of filteredBills) {
      const p = patientMap.get(b.patientId.toString());
      rows.push([
        b.billNumber,
        new Date(Number(b.billDate) / 1000000).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        p?.name ?? "Unknown",
        b.totalAmount.toFixed(2),
        b.paidAmount.toFixed(2),
        (b.totalAmount - b.paidAmount).toFixed(2),
        b.paymentStatus,
      ]);
    }
    downloadCSV("bills.csv", rows);
  };

  const statusBadge = (status: string) => {
    if (status === "paid")
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Paid
        </Badge>
      );
    if (status === "partial")
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          Partial
        </Badge>
      );
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">Unpaid</Badge>
    );
  };

  return (
    <div className="p-6 space-y-5">
      {/* Printable Invoice Portal */}
      {printBill &&
        createPortal(
          <div className="print-root">
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <div className="text-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold">{settings?.clinicName}</h2>
                <p className="text-sm">{settings?.doctorName}</p>
                <p className="text-sm">{settings?.address}</p>
                <p className="text-sm">Ph: {settings?.phone}</p>
                {settings?.gstNumber && (
                  <p className="text-sm">GSTIN: {settings.gstNumber}</p>
                )}
              </div>
              <div className="flex justify-between mb-4">
                <div>
                  <p>
                    <strong>Invoice:</strong> {printBill.billNumber}
                  </p>
                  <p>
                    <strong>Date:</strong> {formatDate(printBill.billDate)}
                  </p>
                  {printBill.paymentMode && (
                    <p>
                      <strong>Payment Mode:</strong> {printBill.paymentMode}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {(() => {
                    const p = patientMap.get(printBill.patientId.toString());
                    return p ? (
                      <>
                        <p>
                          <strong>{p.name}</strong>
                        </p>
                        <p>
                          {p.patientCode} | {p.phone}
                        </p>
                        {p.address && (
                          <p className="text-xs text-gray-600">{p.address}</p>
                        )}
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
              <table className="w-full text-sm border-collapse mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Rate</th>
                    <th className="text-right py-1">Disc%</th>
                    <th className="text-right py-1">GST%</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {printBill.items.map((it, idx) => (
                    <tr
                      key={`print-item-${idx}-${it.name}`}
                      className="border-b"
                    >
                      <td className="py-1">{it.name}</td>
                      <td className="text-center py-1">{it.quantity}</td>
                      <td className="text-right py-1">
                        {formatRupees(it.rate)}
                      </td>
                      <td className="text-right py-1">{it.discount ?? 0}%</td>
                      <td className="text-right py-1">{it.gstPercent}%</td>
                      <td className="text-right py-1">
                        {formatRupees(it.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right space-y-1 text-sm">
                <p>Subtotal: {formatRupees(printBill.subtotal)}</p>
                {printBill.gstAmount > 0 && (
                  <p>GST: {formatRupees(printBill.gstAmount)}</p>
                )}
                <p className="font-bold text-lg">
                  Total: {formatRupees(printBill.totalAmount)}
                </p>
                <p>Paid: {formatRupees(printBill.paidAmount)}</p>
                <p>
                  Balance:{" "}
                  {formatRupees(printBill.totalAmount - printBill.paidAmount)}
                </p>
              </div>
              <p className="mt-4 text-center font-semibold">
                Status: {printBill.paymentStatus.toUpperCase()}
              </p>
            </div>
          </div>,
          document.body,
        )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            Billing &amp; Invoicing
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {(allBills ?? []).length} bills total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportBillsCSV}
            className="gap-2"
            data-ocid="billing.export_button"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="bg-primary text-primary-foreground gap-2"
            data-ocid="billing.add_button"
          >
            <Plus className="w-4 h-4" /> New Bill
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="Search invoice # or patient..."
          className="max-w-xs"
          data-ocid="billing.search_input"
        />
        <div className="flex gap-1">
          {(["all", "pending", "partial", "paid"] as const).map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilterStatus(s);
                setPage(1);
              }}
              className={
                filterStatus === s ? "bg-primary text-primary-foreground" : ""
              }
              data-ocid={`billing.filter.${s}.tab`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Invoice #
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Patient
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Paid
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Due
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedBills.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground"
                      data-ocid="billing.empty_state"
                    >
                      No bills found
                    </td>
                  </tr>
                ) : (
                  paginatedBills.map((b, i) => {
                    const patient = patientMap.get(b.patientId.toString());
                    const balance = b.totalAmount - b.paidAmount;
                    return (
                      <tr
                        key={b.id.toString()}
                        className="hover:bg-muted/20"
                        data-ocid={`billing.item.${i + 1}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {b.billNumber}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {patient?.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {patient?.patientCode}
                          </p>
                        </td>
                        <td className="px-4 py-3">{formatDate(b.billDate)}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatRupees(b.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-700">
                          {formatRupees(b.paidAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-600">
                          {formatRupees(balance)}
                        </td>
                        <td className="px-4 py-3">
                          {statusBadge(b.paymentStatus)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {b.paymentStatus !== PaymentStatus.paid && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600"
                                title="Collect Payment"
                                onClick={() => {
                                  setSelectedBill(b);
                                  setPayAmount(
                                    (b.totalAmount - b.paidAmount).toFixed(2),
                                  );
                                  setPayMode("Cash");
                                  setPayRef("");
                                  setPayDate(
                                    new Date().toISOString().split("T")[0],
                                  );
                                  setPayNotes("");
                                  setPayModalOpen(true);
                                }}
                                data-ocid={`billing.pay_button.${i + 1}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Print Invoice"
                              onClick={() => handlePrint(b)}
                              data-ocid={`billing.print_button.${i + 1}`}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-purple-600"
                              onClick={() => handleBillPdfDownload(b)}
                              title="Download PDF"
                              data-ocid={`billing.pdf_button.${i + 1}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(b.id)}
                              data-ocid={`billing.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  data-ocid="billing.pagination_prev"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  data-ocid="billing.pagination_next"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Bill Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="billing.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading">New Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Patient *</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger data-ocid="billing.patient.select">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {(patients ?? []).map((p) => (
                      <SelectItem key={p.id.toString()} value={p.id.toString()}>
                        {p.name} ({p.patientCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Bill Date *</Label>
                <Input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={enableGST}
                  onCheckedChange={setEnableGST}
                  id="gst-toggle"
                />
                <Label htmlFor="gst-toggle">Enable GST</Label>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Bill Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItems((prev) => [...prev, emptyItem()])}
                  data-ocid="billing.add_item.button"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-2 py-2 font-medium">Item</th>
                      <th className="text-center px-2 py-2 font-medium w-14">
                        Qty
                      </th>
                      <th className="text-right px-2 py-2 font-medium w-20">
                        Rate (₹)
                      </th>
                      <th className="text-right px-2 py-2 font-medium w-16">
                        Disc%
                      </th>
                      {enableGST && (
                        <th className="text-right px-2 py-2 font-medium w-16">
                          GST%
                        </th>
                      )}
                      <th className="text-right px-2 py-2 font-medium w-20">
                        Amount
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((it, idx) => {
                      const computed = calcItem(it);
                      return (
                        <tr key={`bill-item-${idx}-${it.name}`}>
                          <td className="px-2 py-1.5">
                            <Input
                              value={it.name}
                              onChange={(e) =>
                                updateItem(idx, { name: e.target.value })
                              }
                              placeholder="Medicine / Service"
                              className="h-8 text-sm"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) =>
                                updateItem(idx, {
                                  quantity: Number(e.target.value) || 1,
                                })
                              }
                              className="h-8 text-sm text-center w-14"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              min="0"
                              value={it.rate}
                              onChange={(e) =>
                                updateItem(idx, {
                                  rate: Number(e.target.value) || 0,
                                })
                              }
                              className="h-8 text-sm text-right w-20"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={it.discount ?? 0}
                              onChange={(e) =>
                                updateItem(idx, {
                                  discount: Number(e.target.value) || 0,
                                })
                              }
                              className="h-8 text-sm text-right w-16"
                            />
                          </td>
                          {enableGST && (
                            <td className="px-2 py-1.5">
                              <Select
                                value={it.gstPercent.toString()}
                                onValueChange={(v) =>
                                  updateItem(idx, { gstPercent: Number(v) })
                                }
                              >
                                <SelectTrigger className="h-8 text-sm w-16">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {GST_RATES.map((r) => (
                                    <SelectItem key={r} value={r.toString()}>
                                      {r}%
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          )}
                          <td className="px-2 py-1.5 text-right font-medium text-sm">
                            {formatRupees(computed.amount)}
                          </td>
                          <td className="px-1">
                            {items.length > 1 && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground"
                                onClick={() =>
                                  setItems((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  )
                                }
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="ml-auto w-56 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatRupees(subtotal)}</span>
              </div>
              {enableGST && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST</span>
                  <span>{formatRupees(gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Grand Total</span>
                <span>{formatRupees(totalAmount)}</span>
              </div>
            </div>

            {/* Initial Payment */}
            <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
              <p className="text-sm font-medium">Initial Payment (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Amount Paid (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={initialPayAmount}
                    onChange={(e) => setInitialPayAmount(e.target.value)}
                    placeholder="0"
                    data-ocid="billing.init_pay.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Payment Mode</Label>
                  <Select
                    value={initialPayMode}
                    onValueChange={setInitialPayMode}
                  >
                    <SelectTrigger
                      className="h-9"
                      data-ocid="billing.init_mode.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Cash", "UPI", "Card", "Cheque", "Net Banking"].map(
                        (m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={billNotes}
                onChange={(e) => setBillNotes(e.target.value)}
                rows={2}
                data-ocid="billing.notes.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="billing.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground"
              data-ocid="billing.submit_button"
            >
              Create Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Payment Modal */}
      <Dialog
        open={payModalOpen}
        onOpenChange={(o) => {
          setPayModalOpen(o);
          if (!o) setSelectedBill(null);
        }}
      >
        <DialogContent className="max-w-sm" data-ocid="billing.payment.modal">
          <DialogHeader>
            <DialogTitle className="font-heading">Collect Payment</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Invoice:</span>{" "}
                  {selectedBill.billNumber}
                </p>
                <p>
                  <span className="text-muted-foreground">Patient:</span>{" "}
                  {patientMap.get(selectedBill.patientId.toString())?.name ??
                    "Unknown"}
                </p>
                <p>
                  <span className="text-muted-foreground">Total:</span>{" "}
                  {formatRupees(selectedBill.totalAmount)}
                </p>
                <p>
                  <span className="text-muted-foreground">Paid:</span>{" "}
                  {formatRupees(selectedBill.paidAmount)}
                </p>
                <p>
                  <span className="text-muted-foreground">Due:</span>{" "}
                  <strong className="text-orange-600">
                    {formatRupees(
                      selectedBill.totalAmount - selectedBill.paidAmount,
                    )}
                  </strong>
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  data-ocid="billing.payment.amount.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <Select value={payMode} onValueChange={setPayMode}>
                  <SelectTrigger data-ocid="billing.payment.mode.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Cash", "UPI", "Card", "Cheque", "Net Banking"].map(
                      (m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reference / UPI ID</Label>
                <Input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Optional"
                  data-ocid="billing.payment.ref.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayModalOpen(false)}
              data-ocid="billing.payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCollectPayment}
              className="bg-primary text-primary-foreground"
              data-ocid="billing.payment.confirm_button"
            >
              Collect Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="billing.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this bill record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="billing.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteBill.mutateAsync(deleteId!);
                  toast.success("Bill deleted");
                } catch {
                  toast.error("Failed");
                } finally {
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
              data-ocid="billing.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
