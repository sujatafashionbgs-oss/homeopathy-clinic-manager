import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Edit, Eye, Plus, Printer, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Purchase,
  type PurchaseItem,
  type Vendor,
  useAddPurchase,
  useAddStockMovement,
  useAddVendor,
  useAddVendorPayment,
  useAllMedicines,
  useDeletePurchase,
  useDeleteVendor,
  usePurchases,
  useUpdatePurchase,
  useUpdateVendor,
  useVendorPayments,
  useVendors,
} from "../hooks/useQueries";
import { useMockStore } from "../store/mockData";
import {
  formatDate,
  formatRupees,
  nowNanoseconds,
  toNanoseconds,
} from "../utils/formatters";

export default function Vendors() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold">
          Vendors &amp; Purchases
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage suppliers, purchase invoices, and payments
        </p>
      </div>
      <Tabs defaultValue="vendors">
        <TabsList data-ocid="vendors.tab">
          <TabsTrigger value="vendors" data-ocid="vendors.vendors.tab">
            Vendors
          </TabsTrigger>
          <TabsTrigger value="purchases" data-ocid="vendors.purchases.tab">
            Purchase Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" data-ocid="vendors.payments.tab">
            Vendor Payments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="vendors" className="mt-4">
          <VendorsTab />
        </TabsContent>
        <TabsContent value="purchases" className="mt-4">
          <PurchasesTab />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Vendors Tab ───────────────────────────────────────────────────────────────────

const EMPTY_VENDOR = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  gstin: "",
};

function VendorsTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(EMPTY_VENDOR);
  const { data: vendors } = useVendors();
  const { data: purchases } = usePurchases();
  const addVendor = useAddVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  const outstandingMap = new Map<string, number>();
  for (const p of purchases ?? []) {
    const key = p.vendorId.toString();
    const due = p.totalAmount - p.paidAmount;
    outstandingMap.set(key, (outstandingMap.get(key) ?? 0) + due);
  }

  const openAdd = () => {
    setEditVendor(null);
    setForm(EMPTY_VENDOR);
    setModalOpen(true);
  };
  const openEdit = (v: Vendor) => {
    setEditVendor(v);
    setForm({
      name: v.name,
      contactPerson: v.contactPerson,
      phone: v.phone,
      email: v.email,
      address: v.address,
      city: v.city ?? "",
      state: v.state ?? "",
      gstin: v.gstin,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Vendor name is required");
      return;
    }
    try {
      if (editVendor) {
        await updateVendor.mutateAsync({ id: editVendor.id, vendor: form });
        toast.success("Vendor updated");
      } else {
        await addVendor.mutateAsync(form);
        toast.success("Vendor added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground gap-2"
          data-ocid="vendors.add_vendor.button"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </Button>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Vendor Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Contact
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Phone
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  City
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Outstanding
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(vendors ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="vendors.empty_state"
                  >
                    No vendors added
                  </td>
                </tr>
              ) : (
                (vendors ?? []).map((v, i) => {
                  const outstanding = outstandingMap.get(v.id.toString()) ?? 0;
                  return (
                    <tr
                      key={v.id.toString()}
                      className="hover:bg-muted/20"
                      data-ocid={`vendors.item.${i + 1}`}
                    >
                      <td className="px-4 py-3 font-medium">{v.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {v.contactPerson}
                      </td>
                      <td className="px-4 py-3">{v.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {v.city || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {outstanding > 0 ? (
                          <span className="text-orange-600 font-medium">
                            {formatRupees(outstanding)}
                          </span>
                        ) : (
                          <span className="text-green-600 text-xs">Nil</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEdit(v)}
                            data-ocid={`vendors.edit_button.${i + 1}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(v.id)}
                            data-ocid={`vendors.delete_button.${i + 1}`}
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
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg" data-ocid="vendors.vendor.modal">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editVendor ? "Edit Vendor" : "Add Vendor"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Vendor Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Person</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactPerson: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>GSTIN</Label>
              <Input
                value={form.gstin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gstin: e.target.value }))
                }
                placeholder="27AABCH1234F1Z5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="vendors.vendor.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground"
              data-ocid="vendors.vendor.submit_button"
            >
              {editVendor ? "Update" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteVendor.mutateAsync(deleteId!);
                  toast.success("Vendor deleted");
                } catch {
                  toast.error("Failed");
                } finally {
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Purchases Tab ─────────────────────────────────────────────────────────────────

const emptyPurchaseItem = (): PurchaseItem => ({
  medicineName: "",
  qty: 1,
  freeQty: 0,
  unit: "globules",
  batch: "",
  expiry: "",
  rate: 0,
  mrp: 0,
  gstPercent: 5,
  discountPercent: 0,
  amount: 0,
});

const INVOICE_STATUSES = [
  "Draft",
  "Confirmed",
  "Paid",
  "Partially Paid",
] as const;
type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

function invoiceStatusBadge(s: string) {
  if (s === "Paid")
    return <Badge className="bg-green-100 text-green-800 text-xs">Paid</Badge>;
  if (s === "Partially Paid")
    return (
      <Badge className="bg-amber-100 text-amber-800 text-xs">
        Partially Paid
      </Badge>
    );
  if (s === "Confirmed")
    return (
      <Badge className="bg-blue-100 text-blue-800 text-xs">Confirmed</Badge>
    );
  return <Badge className="bg-gray-100 text-gray-800 text-xs">Draft</Badge>;
}

function PurchasesTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Purchase | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState({
    vendorId: "",
    invoiceNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    paymentTerms: 30,
    paidAmount: "",
    invoiceStatus: "Draft" as InvoiceStatus,
    billNotes: "",
    items: [emptyPurchaseItem()],
  });

  const { data: purchases } = usePurchases();
  const { data: vendors } = useVendors();
  const { data: medicines } = useAllMedicines();
  const addPurchase = useAddPurchase();
  const updatePurchase = useUpdatePurchase();
  const deletePurchase = useDeletePurchase();
  const addStockMovement = useAddStockMovement();
  const adjustStock = useMockStore((s) => s.adjustStock);
  const nextPiNumber = useMockStore((s) => s.nextPiNumber);

  const vendorMap = new Map((vendors ?? []).map((v) => [v.id.toString(), v]));

  const updateItem = (idx: number, patch: Partial<PurchaseItem>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, ...patch };
        const base = updated.qty * updated.rate;
        const afterDiscount = base * (1 - (updated.discountPercent ?? 0) / 100);
        updated.amount = afterDiscount;
        return updated;
      }),
    }));

  const subtotal = form.items.reduce(
    (s, it) => s + it.qty * it.rate * (1 - (it.discountPercent ?? 0) / 100),
    0,
  );
  const totalGST = form.items.reduce((s, it) => {
    const base = it.qty * it.rate * (1 - (it.discountPercent ?? 0) / 100);
    return s + (base * (it.gstPercent ?? 0)) / 100;
  }, 0);
  const totalDiscount = form.items.reduce(
    (s, it) => s + (it.qty * it.rate * (it.discountPercent ?? 0)) / 100,
    0,
  );
  const grandTotal = subtotal + totalGST;
  const paid = form.paidAmount ? Number.parseFloat(form.paidAmount) : 0;
  const balanceDue = grandTotal - paid;

  const dueDateStr = (() => {
    const d = new Date(form.purchaseDate || Date.now());
    d.setDate(d.getDate() + form.paymentTerms);
    return d.toISOString().split("T")[0];
  })();

  const resetForm = () =>
    setForm({
      vendorId: "",
      invoiceNumber: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      paymentTerms: 30,
      paidAmount: "",
      invoiceStatus: "Draft",
      billNotes: "",
      items: [emptyPurchaseItem()],
    });

  const handleSubmit = async () => {
    if (!form.vendorId) {
      toast.error("Vendor is required");
      return;
    }
    if (form.items.every((it) => !it.medicineName)) {
      toast.error("Add at least one item");
      return;
    }
    try {
      const validItems = form.items.filter((it) => it.medicineName);
      const paidAmt = paid;
      const status: "paid" | "partial" | "unpaid" =
        paidAmt >= grandTotal ? "paid" : paidAmt > 0 ? "partial" : "unpaid";
      const invStatus: InvoiceStatus =
        paidAmt >= grandTotal
          ? "Paid"
          : paidAmt > 0
            ? "Partially Paid"
            : form.invoiceStatus;

      await addPurchase.mutateAsync({
        poNumber: "",
        piNumber: "",
        vendorId: BigInt(form.vendorId),
        invoiceNumber: form.invoiceNumber,
        purchaseDate: form.purchaseDate
          ? toNanoseconds(form.purchaseDate)
          : nowNanoseconds(),
        items: validItems,
        subtotal: Math.round(subtotal * 100) / 100,
        gstAmount: Math.round(totalGST * 100) / 100,
        totalAmount: Math.round(grandTotal * 100) / 100,
        paidAmount: Math.min(paidAmt, grandTotal),
        status,
        invoiceStatus: invStatus,
        paymentTerms: form.paymentTerms,
        dueDate: toNanoseconds(dueDateStr),
        billNotes: form.billNotes,
      });

      // If Confirmed or Paid, update stock
      if (
        invStatus === "Confirmed" ||
        invStatus === "Paid" ||
        invStatus === "Partially Paid"
      ) {
        const piNum = `PI-${new Date().getFullYear()}-${String(nextPiNumber).padStart(5, "0")}`;
        for (const item of validItems) {
          const med = item.medicineId
            ? (medicines ?? []).find((m) => m.id === item.medicineId)
            : (medicines ?? []).find(
                (m) =>
                  `${m.name} ${m.potency}`.toLowerCase() ===
                    item.medicineName.toLowerCase() ||
                  m.name.toLowerCase() === item.medicineName.toLowerCase(),
              );
          if (med) {
            adjustStock(med.id, item.qty + (item.freeQty ?? 0));
            addStockMovement.mutateAsync({
              medicineId: med.id,
              date: nowNanoseconds(),
              type: "Add",
              movementType: "Purchase In",
              qtyIn: item.qty + (item.freeQty ?? 0),
              qtyOut: 0,
              balance: Number(med.quantity) + item.qty + (item.freeQty ?? 0),
              reference: piNum,
              notes: `Purchase from ${vendorMap.get(form.vendorId)?.name ?? "Vendor"}`,
              by: "Admin",
            });
          }
        }
        toast.success("✓ Stock updated for confirmed invoice");
      }

      toast.success("Purchase Invoice saved");
      setModalOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleConfirmInvoice = async (p: Purchase) => {
    if (p.invoiceStatus === "Confirmed" || p.invoiceStatus === "Paid") {
      toast.info("Invoice already confirmed");
      return;
    }
    try {
      await updatePurchase.mutateAsync({
        id: p.id,
        purchase: { invoiceStatus: "Confirmed" },
      });
      // Update stock for each item
      for (const item of p.items) {
        const med = item.medicineId
          ? (medicines ?? []).find((m) => m.id === item.medicineId)
          : (medicines ?? []).find(
              (m) =>
                `${m.name} ${m.potency}`.toLowerCase() ===
                  item.medicineName.toLowerCase() ||
                m.name.toLowerCase() === item.medicineName.toLowerCase(),
            );
        if (med) {
          adjustStock(med.id, item.qty + (item.freeQty ?? 0));
          addStockMovement.mutateAsync({
            medicineId: med.id,
            date: nowNanoseconds(),
            type: "Add",
            movementType: "Purchase In",
            qtyIn: item.qty + (item.freeQty ?? 0),
            qtyOut: 0,
            balance: Number(med.quantity) + item.qty + (item.freeQty ?? 0),
            reference: p.piNumber ?? p.poNumber,
            notes: `Confirmed: ${p.invoiceNumber}`,
            by: "Admin",
          });
        }
      }
      toast.success("✓ Invoice confirmed & stock updated");
    } catch {
      toast.error("Failed to confirm");
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="bg-primary text-primary-foreground gap-2"
          data-ocid="vendors.add_purchase.button"
        >
          <Plus className="w-4 h-4" /> New Purchase Invoice
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    PI #
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Vendor
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Bill No.
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Items
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Grand Total
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Paid
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Balance
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
                {(purchases ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-10 text-muted-foreground"
                      data-ocid="purchases.empty_state"
                    >
                      No purchase invoices found
                    </td>
                  </tr>
                ) : (
                  (purchases ?? []).map((p, i) => {
                    const vendor = vendorMap.get(p.vendorId.toString());
                    const due = p.totalAmount - p.paidAmount;
                    return (
                      <tr
                        key={p.id.toString()}
                        className="hover:bg-muted/20"
                        data-ocid={`purchases.item.${i + 1}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                          {p.piNumber ?? p.poNumber}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(p.purchaseDate)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {vendor?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {p.invoiceNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.items.length}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatRupees(p.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-700">
                          {formatRupees(p.paidAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-600">
                          {formatRupees(due)}
                        </td>
                        <td className="px-4 py-3">
                          {invoiceStatusBadge(p.invoiceStatus ?? p.status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="View Invoice"
                              onClick={() => setViewInvoice(p)}
                              data-ocid={`purchases.view_button.${i + 1}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(p.invoiceStatus === "Draft" ||
                              !p.invoiceStatus) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-600"
                                title="Confirm Invoice"
                                onClick={() => handleConfirmInvoice(p)}
                                data-ocid={`purchases.confirm_button.${i + 1}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteId(p.id)}
                              data-ocid={`purchases.delete_button.${i + 1}`}
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
        </CardContent>
      </Card>

      {/* New Purchase Invoice Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          data-ocid="vendors.purchase.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading">
              New Purchase Invoice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Header Fields */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium">
                Invoice Number (Auto)
              </p>
              <p className="font-mono font-bold text-primary">
                PI-{new Date().getFullYear()}-
                {String(nextPiNumber).padStart(5, "0")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Vendor *</Label>
                <Select
                  value={form.vendorId}
                  onValueChange={(v) => setForm((f) => ({ ...f, vendorId: v }))}
                >
                  <SelectTrigger data-ocid="vendors.purchase.vendor.select">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(vendors ?? []).map((v) => (
                      <SelectItem key={v.id.toString()} value={v.id.toString()}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Date *</Label>
                <Input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                  }
                  data-ocid="vendors.purchase.date.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Vendor&apos;s Bill No.</Label>
                <Input
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, invoiceNumber: e.target.value }))
                  }
                  placeholder="VEN-2026-001"
                  data-ocid="vendors.purchase.billno.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Terms</Label>
                <Select
                  value={form.paymentTerms.toString()}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, paymentTerms: Number(v) }))
                  }
                >
                  <SelectTrigger data-ocid="vendors.purchase.terms.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45, 60].map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        {d === 0 ? "Immediate" : `Net ${d} days`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date (Auto)</Label>
                <Input
                  type="date"
                  value={dueDateStr}
                  readOnly
                  className="bg-muted/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Status</Label>
                <Select
                  value={form.invoiceStatus}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      invoiceStatus: v as InvoiceStatus,
                    }))
                  }
                >
                  <SelectTrigger data-ocid="vendors.purchase.status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Purchase Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      items: [...f.items, emptyPurchaseItem()],
                    }))
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                </Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[900px]">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left px-2 py-2">Medicine / Item</th>
                        <th className="text-center px-2 py-2 w-14">Qty</th>
                        <th className="text-center px-2 py-2 w-14">Free</th>
                        <th className="text-left px-2 py-2 w-16">Unit</th>
                        <th className="text-left px-2 py-2 w-20">Batch</th>
                        <th className="text-left px-2 py-2 w-24">Expiry</th>
                        <th className="text-right px-2 py-2 w-20">Rate ₹</th>
                        <th className="text-right px-2 py-2 w-20">MRP ₹</th>
                        <th className="text-center px-2 py-2 w-16">GST%</th>
                        <th className="text-center px-2 py-2 w-16">Disc%</th>
                        <th className="text-right px-2 py-2 w-24">Amount</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {form.items.map((it, idx) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: form row
                        <tr key={idx}>
                          <td className="px-1 py-1">
                            <Input
                              value={it.medicineName}
                              onChange={(e) => {
                                const med = (medicines ?? []).find(
                                  (m) =>
                                    `${m.name} ${m.potency}`.toLowerCase() ===
                                      e.target.value.toLowerCase() ||
                                    m.name.toLowerCase() ===
                                      e.target.value.toLowerCase(),
                                );
                                updateItem(idx, {
                                  medicineName: e.target.value,
                                  medicineId: med?.id ?? undefined,
                                  rate: med?.purchasePrice ?? it.rate,
                                  mrp: med?.sellingPrice ?? it.mrp,
                                });
                              }}
                              list={`med-list-pi-${idx}`}
                              className="h-7 text-xs"
                              placeholder="Medicine name"
                            />
                            <datalist id={`med-list-pi-${idx}`}>
                              {(medicines ?? []).map((m) => (
                                <option
                                  key={m.id.toString()}
                                  value={`${m.name} ${m.potency}`}
                                />
                              ))}
                            </datalist>
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min="0"
                              value={it.qty}
                              onChange={(e) =>
                                updateItem(idx, {
                                  qty: Number(e.target.value) || 0,
                                })
                              }
                              className="h-7 text-xs text-center w-12"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min="0"
                              value={it.freeQty ?? 0}
                              onChange={(e) =>
                                updateItem(idx, {
                                  freeQty: Number(e.target.value) || 0,
                                })
                              }
                              className="h-7 text-xs text-center w-12"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              value={it.unit ?? ""}
                              onChange={(e) =>
                                updateItem(idx, { unit: e.target.value })
                              }
                              className="h-7 text-xs w-14"
                              placeholder="ml"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              value={it.batch ?? ""}
                              onChange={(e) =>
                                updateItem(idx, { batch: e.target.value })
                              }
                              className="h-7 text-xs w-20"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="date"
                              value={it.expiry ?? ""}
                              onChange={(e) =>
                                updateItem(idx, { expiry: e.target.value })
                              }
                              className="h-7 text-xs w-24"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min="0"
                              value={it.rate}
                              onChange={(e) =>
                                updateItem(idx, {
                                  rate: Number(e.target.value) || 0,
                                })
                              }
                              className="h-7 text-xs text-right w-18"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min="0"
                              value={it.mrp ?? 0}
                              onChange={(e) =>
                                updateItem(idx, {
                                  mrp: Number(e.target.value) || 0,
                                })
                              }
                              className="h-7 text-xs text-right w-18"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Select
                              value={(it.gstPercent ?? 5).toString()}
                              onValueChange={(v) =>
                                updateItem(idx, { gstPercent: Number(v) })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-14">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[0, 5, 12, 18].map((r) => (
                                  <SelectItem key={r} value={r.toString()}>
                                    {r}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={it.discountPercent ?? 0}
                              onChange={(e) =>
                                updateItem(idx, {
                                  discountPercent: Number(e.target.value) || 0,
                                })
                              }
                              className="h-7 text-xs text-center w-14"
                            />
                          </td>
                          <td className="px-2 py-1 text-right font-medium">
                            {formatRupees(it.amount)}
                          </td>
                          <td className="px-1">
                            {form.items.length > 1 && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  setForm((f) => ({
                                    ...f,
                                    items: f.items.filter((_, i) => i !== idx),
                                  }))
                                }
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={form.billNotes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, billNotes: e.target.value }))
                  }
                  rows={2}
                  placeholder="Any notes about this invoice..."
                  data-ocid="vendors.purchase.notes.textarea"
                />
              </div>
              <div className="ml-auto w-60 space-y-1 text-sm border rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatRupees(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total GST</span>
                  <span>{formatRupees(totalGST)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Discount</span>
                  <span className="text-green-600">
                    - {formatRupees(totalDiscount)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Grand Total</span>
                  <span>{formatRupees(grandTotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground">Amount Paid (₹)</span>
                  <Input
                    type="number"
                    min="0"
                    value={form.paidAmount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, paidAmount: e.target.value }))
                    }
                    className="h-7 text-xs text-right w-28"
                    data-ocid="vendors.purchase.paid.input"
                  />
                </div>
                <div className="flex justify-between font-semibold text-orange-600 border-t pt-1">
                  <span>Balance Due</span>
                  <span>{formatRupees(balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="vendors.purchase.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground"
              data-ocid="vendors.purchase.submit_button"
            >
              Save Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      {viewInvoice && (
        <Dialog
          open={!!viewInvoice}
          onOpenChange={(o) => !o && setViewInvoice(null)}
        >
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            data-ocid="vendors.view_invoice.modal"
          >
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="font-heading">
                  Purchase Invoice
                </DialogTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 no-print"
                  onClick={() => {
                    const el = document.getElementById("pi-print-area");
                    if (!el) return;
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(
                        `<html><head><title>Invoice</title><style>body{font-family:Arial,sans-serif;font-size:11pt;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px}th{background:#f5f5f5}</style></head><body>${el.innerHTML}</body></html>`,
                      );
                      w.document.close();
                      setTimeout(() => w.print(), 300);
                    }
                  }}
                  data-ocid="vendors.print_invoice.button"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
              </div>
            </DialogHeader>
            <div id="pi-print-area" className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 border rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Invoice No.</p>
                  <p className="font-mono font-bold text-primary">
                    {viewInvoice.piNumber ?? viewInvoice.poNumber}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Vendor Bill No.
                  </p>
                  <p className="font-medium">
                    {viewInvoice.invoiceNumber || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {formatDate(viewInvoice.purchaseDate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Vendor</p>
                  <p className="font-medium">
                    {vendorMap.get(viewInvoice.vendorId.toString())?.name ??
                      "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Status</p>
                  <p>
                    {invoiceStatusBadge(
                      viewInvoice.invoiceStatus ?? viewInvoice.status,
                    )}
                  </p>
                </div>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="text-left border px-3 py-2">Item</th>
                    <th className="text-center border px-3 py-2">Qty</th>
                    <th className="text-center border px-3 py-2">Unit</th>
                    <th className="text-left border px-3 py-2">Batch</th>
                    <th className="text-right border px-3 py-2">Rate</th>
                    <th className="text-right border px-3 py-2">MRP</th>
                    <th className="text-center border px-3 py-2">GST%</th>
                    <th className="text-center border px-3 py-2">Disc%</th>
                    <th className="text-right border px-3 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoice.items.map((it, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: view only
                    <tr key={i}>
                      <td className="border px-3 py-1.5">{it.medicineName}</td>
                      <td className="border px-3 py-1.5 text-center">
                        {it.qty}
                        {it.freeQty ? `+${it.freeQty}F` : ""}
                      </td>
                      <td className="border px-3 py-1.5 text-center">
                        {it.unit ?? "—"}
                      </td>
                      <td className="border px-3 py-1.5">{it.batch ?? "—"}</td>
                      <td className="border px-3 py-1.5 text-right">
                        {formatRupees(it.rate)}
                      </td>
                      <td className="border px-3 py-1.5 text-right">
                        {it.mrp ? formatRupees(it.mrp) : "—"}
                      </td>
                      <td className="border px-3 py-1.5 text-center">
                        {it.gstPercent ?? 0}%
                      </td>
                      <td className="border px-3 py-1.5 text-center">
                        {it.discountPercent ?? 0}%
                      </td>
                      <td className="border px-3 py-1.5 text-right font-medium">
                        {formatRupees(it.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end">
                <div className="w-56 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatRupees(viewInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST</span>
                    <span>{formatRupees(viewInvoice.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Grand Total</span>
                    <span>{formatRupees(viewInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Paid</span>
                    <span>{formatRupees(viewInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 font-semibold">
                    <span>Balance</span>
                    <span>
                      {formatRupees(
                        viewInvoice.totalAmount - viewInvoice.paidAmount,
                      )}
                    </span>
                  </div>
                </div>
              </div>
              {viewInvoice.billNotes && (
                <div className="border rounded p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{viewInvoice.billNotes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewInvoice(null)}
                data-ocid="vendors.view_invoice.close_button"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Invoice?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deletePurchase.mutateAsync(deleteId!);
                  toast.success("Deleted");
                } catch {
                  toast.error("Failed");
                } finally {
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Vendor Payments Tab ───────────────────────────────────────────────────────────

function PaymentsTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterVendor, setFilterVendor] = useState("all");
  const [form, setForm] = useState({
    vendorId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    mode: "NEFT",
    reference: "",
    notes: "",
  });
  const { data: payments } = useVendorPayments();
  const { data: vendors } = useVendors();
  const addPayment = useAddVendorPayment();
  const vendorMap = new Map((vendors ?? []).map((v) => [v.id.toString(), v]));

  const filteredPayments = (payments ?? []).filter(
    (p) => filterVendor === "all" || p.vendorId.toString() === filterVendor,
  );

  const handleSubmit = async () => {
    if (!form.vendorId || !form.amount) {
      toast.error("Vendor and amount are required");
      return;
    }
    try {
      await addPayment.mutateAsync({
        vendorId: BigInt(form.vendorId),
        amount: Number(form.amount),
        paymentDate: form.paymentDate
          ? toNanoseconds(form.paymentDate)
          : nowNanoseconds(),
        mode: form.mode,
        reference: form.reference,
        notes: form.notes,
      });
      toast.success("Payment recorded");
      setModalOpen(false);
      setForm({
        vendorId: "",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        mode: "NEFT",
        reference: "",
        notes: "",
      });
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Select value={filterVendor} onValueChange={setFilterVendor}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {(vendors ?? []).map((v) => (
              <SelectItem key={v.id.toString()} value={v.id.toString()}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-primary-foreground gap-2"
          data-ocid="vendors.add_payment.button"
        >
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Vendor
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Mode
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="vendor_payments.empty_state"
                  >
                    No payments recorded
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, i) => (
                  <tr
                    key={p.id.toString()}
                    className="hover:bg-muted/20"
                    data-ocid={`vendor_payments.item.${i + 1}`}
                  >
                    <td className="px-4 py-3">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3">
                      {vendorMap.get(p.vendorId.toString())?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatRupees(p.amount)}
                    </td>
                    <td className="px-4 py-3">{p.mode}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.reference || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Record Vendor Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Vendor *</Label>
              <Select
                value={form.vendorId}
                onValueChange={(v) => setForm((f) => ({ ...f, vendorId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {(vendors ?? []).map((v) => (
                    <SelectItem key={v.id.toString()} value={v.id.toString()}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <Select
                value={form.mode}
                onValueChange={(v) => setForm((f) => ({ ...f, mode: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Cash", "UPI", "NEFT", "Cheque", "RTGS"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference</Label>
              <Input
                value={form.reference}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reference: e.target.value }))
                }
                placeholder="Cheque/UTR no."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground"
            >
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
