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
import { Edit, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type PurchaseItem,
  type Vendor,
  useAddPurchase,
  useAddVendor,
  useAddVendorPayment,
  useAllMedicines,
  useDeletePurchase,
  useDeleteVendor,
  usePurchases,
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
          Manage suppliers, purchases, and payments
        </p>
      </div>
      <Tabs defaultValue="vendors">
        <TabsList data-ocid="vendors.tab">
          <TabsTrigger value="vendors" data-ocid="vendors.vendors.tab">
            Vendors
          </TabsTrigger>
          <TabsTrigger value="purchases" data-ocid="vendors.purchases.tab">
            Purchases
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

// ─── Vendors Tab ─────────────────────────────────────────────────────────────

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

  // Outstanding = sum of unpaid/partial amounts per vendor
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
                  Name
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
                  Outstanding ₹
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
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>GSTIN</Label>
              <Input
                value={form.gstin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gstin: e.target.value }))
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
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
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

// ─── Purchases Tab ────────────────────────────────────────────────────────────

const emptyPurchaseItem = (): PurchaseItem => ({
  medicineName: "",
  qty: 1,
  freeQty: 0,
  unit: "",
  batch: "",
  expiry: "",
  rate: 0,
  amount: 0,
});

function PurchasesTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState({
    vendorId: "",
    invoiceNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    items: [emptyPurchaseItem()],
    gstPercent: 5,
    paidAmount: "",
  });

  const { data: purchases } = usePurchases();
  const { data: vendors } = useVendors();
  const { data: medicines } = useAllMedicines();
  const addPurchase = useAddPurchase();
  const deletePurchase = useDeletePurchase();
  const adjustStock = useMockStore((s) => s.adjustStock);

  const vendorMap = new Map((vendors ?? []).map((v) => [v.id.toString(), v]));

  const updateItem = (idx: number, patch: Partial<PurchaseItem>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, ...patch };
        updated.amount = updated.qty * updated.rate;
        return updated;
      }),
    }));

  const subtotal = form.items.reduce((s, it) => s + it.qty * it.rate, 0);
  const gstAmount = (subtotal * form.gstPercent) / 100;
  const totalAmount = subtotal + gstAmount;

  const resetForm = () =>
    setForm({
      vendorId: "",
      invoiceNumber: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      items: [emptyPurchaseItem()],
      gstPercent: 5,
      paidAmount: "",
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
      const paid = form.paidAmount ? Number.parseFloat(form.paidAmount) : 0;
      const status: "paid" | "partial" | "unpaid" =
        paid >= totalAmount ? "paid" : paid > 0 ? "partial" : "unpaid";
      await addPurchase.mutateAsync({
        poNumber: "", // auto-generated in store
        vendorId: BigInt(form.vendorId),
        invoiceNumber: form.invoiceNumber,
        purchaseDate: form.purchaseDate
          ? toNanoseconds(form.purchaseDate)
          : nowNanoseconds(),
        items: validItems,
        subtotal,
        gstAmount,
        totalAmount,
        paidAmount: Math.min(paid, totalAmount),
        status,
      });
      // Auto-update medicine stock for each item
      for (const item of validItems) {
        if (item.medicineId) {
          adjustStock(item.medicineId, item.qty + (item.freeQty ?? 0));
        } else {
          // Try to find by name match
          const med = (medicines ?? []).find(
            (m) =>
              `${m.name} ${m.potency}` === item.medicineName ||
              m.name === item.medicineName,
          );
          if (med) adjustStock(med.id, item.qty + (item.freeQty ?? 0));
        }
      }
      toast.success("Purchase saved & stock updated");
      setModalOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save");
    }
  };

  const statusBadge = (s: string) => {
    if (s === "paid")
      return (
        <Badge className="bg-green-100 text-green-800 text-xs">Paid</Badge>
      );
    if (s === "partial")
      return (
        <Badge className="bg-amber-100 text-amber-800 text-xs">Partial</Badge>
      );
    return <Badge className="bg-red-100 text-red-800 text-xs">Unpaid</Badge>;
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
          <Plus className="w-4 h-4" /> New Purchase
        </Button>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    PO #
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Vendor
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Items
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Total ₹
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Paid ₹
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Due ₹
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
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                      data-ocid="purchases.empty_state"
                    >
                      No purchases recorded
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
                        <td className="px-4 py-3 font-mono text-xs">
                          {p.poNumber}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(p.purchaseDate)}
                        </td>
                        <td className="px-4 py-3">{vendor?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
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
                        <td className="px-4 py-3">{statusBadge(p.status)}</td>
                        <td className="px-4 py-3">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(p.id)}
                            data-ocid={`purchases.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* New Purchase Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="vendors.purchase.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading">New Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
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
              <div className="space-y-1.5">
                <Label>Invoice / Bill No.</Label>
                <Input
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, invoiceNumber: e.target.value }))
                  }
                  placeholder="VEN-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Date *</Label>
                <Input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Purchase Items</Label>
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
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-2 py-2">Medicine</th>
                      <th className="text-center px-2 py-2 w-16">Qty</th>
                      <th className="text-center px-2 py-2 w-16">Free</th>
                      <th className="text-left px-2 py-2 w-16">Unit</th>
                      <th className="text-left px-2 py-2 w-20">Batch</th>
                      <th className="text-left px-2 py-2 w-24">Expiry</th>
                      <th className="text-right px-2 py-2 w-20">Rate ₹</th>
                      <th className="text-right px-2 py-2 w-20">Amount</th>
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
                                  `${m.name} ${m.potency}` === e.target.value ||
                                  m.name === e.target.value,
                              );
                              updateItem(idx, {
                                medicineName: e.target.value,
                                medicineId: med?.id ?? undefined,
                              });
                            }}
                            list={`med-list-purchase-${idx}`}
                            className="h-7 text-xs"
                            placeholder="Medicine name"
                          />
                          <datalist id={`med-list-purchase-${idx}`}>
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
                            className="h-7 text-xs text-center w-14"
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
                            className="h-7 text-xs text-center w-14"
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
                            className="h-7 text-xs text-right w-20"
                          />
                        </td>
                        <td className="px-2 py-1 text-right font-medium">
                          {formatRupees(it.qty * it.rate)}
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

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>GST %</Label>
                <Select
                  value={form.gstPercent.toString()}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, gstPercent: Number(v) }))
                  }
                >
                  <SelectTrigger className="w-24">
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
              </div>
              <div className="ml-auto w-48 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatRupees(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    GST ({form.gstPercent}%)
                  </span>
                  <span>{formatRupees(gstAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Grand Total</span>
                  <span>{formatRupees(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Amount Paid (₹)</Label>
              <Input
                type="number"
                min="0"
                value={form.paidAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paidAmount: e.target.value }))
                }
                placeholder="0"
                className="max-w-xs"
              />
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
              Save Purchase
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
            <AlertDialogTitle>Delete Purchase?</AlertDialogTitle>
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
                  Amount ₹
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
