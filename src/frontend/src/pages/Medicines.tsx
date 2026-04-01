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
import { Checkbox } from "@/components/ui/checkbox";
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
import { AlertTriangle, Edit, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Medicine,
  type StockMovement,
  useAddMedicine,
  useAddStockMovement,
  useAllMedicines,
  useDeleteMedicine,
  useMedicineCategories,
  useStockMovements,
  useUpdateMedicine,
} from "../hooks/useQueries";
import { useMockStore } from "../store/mockData";
import { formatDate, formatRupees, nowNanoseconds } from "../utils/formatters";

const FORMS = ["Dilution", "Globules", "Mother Tincture", "Tablet", "Ointment"];
const STOCK_UNITS = ["ml", "grams", "tablets", "globules"];

const EMPTY_FORM = {
  name: "",
  category: "",
  company: "",
  form: "",
  potency: "",
  hsnCode: "",
  batchNo: "",
  expiryDate: "",
  purchasePrice: "",
  unitPrice: "",
  sellingPrice: "",
  quantity: "",
  stockUnit: "globules",
  minStockLevel: "",
  rackLocation: "",
  isActive: true,
};

export default function Medicines() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adjustMed, setAdjustMed] = useState<Medicine | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"Add" | "Remove" | "Correction">(
    "Add",
  );
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustDate, setAdjustDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPotency, setFilterPotency] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: medicines } = useAllMedicines();
  const { data: categories } = useMedicineCategories();
  const addMedicine = useAddMedicine();
  const updateMedicine = useUpdateMedicine();
  const deleteMedicine = useDeleteMedicine();
  const adjustStock = useMockStore((s) => s.adjustStock);
  const addStockMovement = useAddStockMovement();

  // Get stock movements for the selected medicine
  const { data: allMovements } = useStockMovements(adjustMed?.id);

  const filteredMedicines = (medicines ?? []).filter((m) => {
    if (lowStockOnly && m.quantity > m.minStockLevel) return false;
    if (filterCategory !== "all" && m.category !== filterCategory) return false;
    if (filterPotency !== "all" && m.potency !== filterPotency) return false;
    if (
      searchQuery &&
      !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(m.company ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const openAdd = () => {
    setEditMedicine(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (m: Medicine) => {
    setEditMedicine(m);
    setForm({
      name: m.name,
      category: m.category,
      company: m.company ?? "",
      form: m.form ?? "",
      potency: m.potency,
      hsnCode: m.hsnCode ?? "",
      batchNo: m.batchNo ?? "",
      expiryDate: m.expiryDate ?? "",
      purchasePrice: m.purchasePrice?.toString() ?? "",
      unitPrice: m.unitPrice.toString(),
      sellingPrice: m.sellingPrice?.toString() ?? "",
      quantity: m.quantity.toString(),
      stockUnit: m.stockUnit ?? "globules",
      minStockLevel: m.minStockLevel.toString(),
      rackLocation: m.rackLocation ?? "",
      isActive: m.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Medicine name is required");
      return;
    }
    if (!form.category) {
      toast.error("Category is required");
      return;
    }
    try {
      const data = {
        name: form.name,
        category: form.category,
        company: form.company || undefined,
        form: form.form || undefined,
        potency: form.potency,
        hsnCode: form.hsnCode || undefined,
        batchNo: form.batchNo || undefined,
        expiryDate: form.expiryDate || undefined,
        purchasePrice: form.purchasePrice
          ? Number.parseFloat(form.purchasePrice)
          : undefined,
        unitPrice: Number.parseFloat(form.unitPrice) || 0,
        sellingPrice: form.sellingPrice
          ? Number.parseFloat(form.sellingPrice)
          : undefined,
        quantity: BigInt(form.quantity || "0"),
        stockUnit: form.stockUnit || undefined,
        minStockLevel: BigInt(form.minStockLevel || "0"),
        rackLocation: form.rackLocation || undefined,
        isActive: form.isActive,
      };
      if (editMedicine) {
        await updateMedicine.mutateAsync({
          id: editMedicine.id,
          medicine: data,
        });
        toast.success("Medicine updated");
      } else {
        await addMedicine.mutateAsync(data);
        toast.success("Medicine added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleAdjust = async () => {
    if (!adjustMed || !adjustQty) return;
    const qty = Number.parseInt(adjustQty, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    const delta =
      adjustType === "Add" ? qty : adjustType === "Remove" ? -qty : 0;
    const newBalance = Number(adjustMed.quantity) + delta;
    adjustStock(adjustMed.id, delta);
    await addStockMovement.mutateAsync({
      medicineId: adjustMed.id,
      date: nowNanoseconds(),
      type: adjustType,
      qtyIn: adjustType === "Add" ? qty : adjustType === "Correction" ? qty : 0,
      qtyOut: adjustType === "Remove" ? qty : 0,
      balance: adjustType === "Correction" ? qty : newBalance,
      notes: adjustNote || undefined,
    });
    if (adjustType === "Correction") {
      // Set absolute value
      const current = Number(adjustMed.quantity);
      adjustStock(adjustMed.id, qty - current);
    }
    toast.success(`Stock adjusted: ${adjustType}`);
    setAdjustMed(null);
    setAdjustQty("");
    setAdjustNote("");
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            Medicine Inventory
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {(medicines ?? []).length} medicines ·{" "}
            <span className="text-amber-600">
              {
                (medicines ?? []).filter((m) => m.quantity <= m.minStockLevel)
                  .length
              }{" "}
              low stock
            </span>
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground gap-2"
          data-ocid="medicines.add_button"
        >
          <Plus className="w-4 h-4" /> Add Medicine
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 w-56"
            placeholder="Search by name / company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-ocid="medicines.search_input"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id.toString()} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPotency} onValueChange={setFilterPotency}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Potency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Potency</SelectItem>
            {["6C", "30C", "200C", "1M", "10M", "Q"].map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox
            id="low-stock-only"
            checked={lowStockOnly}
            onCheckedChange={(v) => setLowStockOnly(!!v)}
            data-ocid="medicines.low_stock.checkbox"
          />
          <Label htmlFor="low-stock-only" className="text-sm cursor-pointer">
            Low Stock Only
          </Label>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Company
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Form
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Potency
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Stock
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Reorder
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Buy ₹
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Sell ₹
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Expiry
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-12 text-muted-foreground"
                      data-ocid="medicines.empty_state"
                    >
                      No medicines found
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((m, i) => {
                    const isLow = m.quantity <= m.minStockLevel;
                    return (
                      <tr
                        key={m.id.toString()}
                        className={`hover:bg-muted/20 ${isLow ? "bg-amber-50/50" : ""}`}
                        data-ocid={`medicines.item.${i + 1}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isLow && (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            <span className="font-medium">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {m.category}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {m.company || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">{m.form || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="bg-muted px-2 py-0.5 rounded text-xs">
                            {m.potency || "—"}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${isLow ? "text-amber-700" : ""}`}
                        >
                          {Number(m.quantity)} {m.stockUnit || ""}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {Number(m.minStockLevel)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {m.purchasePrice
                            ? formatRupees(m.purchasePrice)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {formatRupees(m.sellingPrice ?? m.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {m.expiryDate || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Adjust Stock"
                              onClick={() => {
                                setAdjustMed(m);
                                setAdjustQty("");
                                setAdjustType("Add");
                                setAdjustNote("");
                              }}
                              data-ocid={`medicines.adjust_button.${i + 1}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(m)}
                              data-ocid={`medicines.edit_button.${i + 1}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(m.id)}
                              data-ocid={`medicines.delete_button.${i + 1}`}
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="medicines.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editMedicine ? "Edit Medicine" : "Add Medicine"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Medicine Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Arnica Montana"
                data-ocid="medicines.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger data-ocid="medicines.category.select">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id.toString()} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Form *</Label>
              <Select
                value={form.form}
                onValueChange={(v) => setForm((f) => ({ ...f, form: v }))}
              >
                <SelectTrigger data-ocid="medicines.form.select">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {FORMS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input
                value={form.company}
                onChange={(e) =>
                  setForm((f) => ({ ...f, company: e.target.value }))
                }
                placeholder="SBL, Medisynth..."
                data-ocid="medicines.company.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Potency</Label>
              <Input
                value={form.potency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, potency: e.target.value }))
                }
                placeholder="30C, 200C, Q"
                data-ocid="medicines.potency.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>HSN Code</Label>
              <Input
                value={form.hsnCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hsnCode: e.target.value }))
                }
                placeholder="3004"
                data-ocid="medicines.hsn.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Batch No.</Label>
              <Input
                value={form.batchNo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, batchNo: e.target.value }))
                }
                data-ocid="medicines.batch.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiryDate: e.target.value }))
                }
                data-ocid="medicines.expiry.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Price (₹) *</Label>
              <Input
                type="number"
                min="0"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purchasePrice: e.target.value }))
                }
                data-ocid="medicines.buy_price.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Selling Price (₹) *</Label>
              <Input
                type="number"
                min="0"
                value={form.sellingPrice || form.unitPrice}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sellingPrice: e.target.value,
                    unitPrice: e.target.value,
                  }))
                }
                data-ocid="medicines.sell_price.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stock Quantity *</Label>
              <Input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: e.target.value }))
                }
                data-ocid="medicines.quantity.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stock Unit</Label>
              <Select
                value={form.stockUnit}
                onValueChange={(v) => setForm((f) => ({ ...f, stockUnit: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reorder Level *</Label>
              <Input
                type="number"
                min="0"
                value={form.minStockLevel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minStockLevel: e.target.value }))
                }
                data-ocid="medicines.reorder.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rack / Location</Label>
              <Input
                value={form.rackLocation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rackLocation: e.target.value }))
                }
                placeholder="A-1"
                data-ocid="medicines.rack.input"
              />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch
                id="med-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="med-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="medicines.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground"
              data-ocid="medicines.submit_button"
            >
              {editMedicine ? "Update" : "Add Medicine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Modal */}
      <Dialog open={!!adjustMed} onOpenChange={(o) => !o && setAdjustMed(null)}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="medicines.adjust.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading">Adjust Stock</DialogTitle>
          </DialogHeader>
          {adjustMed && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">
                  {adjustMed.name} {adjustMed.potency}
                </p>
                <p className="text-sm text-muted-foreground">
                  Current Stock: <strong>{Number(adjustMed.quantity)}</strong>{" "}
                  {adjustMed.stockUnit}
                </p>
              </div>
              <div className="flex gap-2">
                {(["Add", "Remove", "Correction"] as const).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={adjustType === t ? "default" : "outline"}
                    className={
                      adjustType === t
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }
                    onClick={() => setAdjustType(t)}
                  >
                    {t === "Add" ? (
                      <Plus className="w-3.5 h-3.5 mr-1" />
                    ) : t === "Remove" ? (
                      <Minus className="w-3.5 h-3.5 mr-1" />
                    ) : null}
                    {t}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    data-ocid="medicines.adjust.quantity.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={adjustDate}
                    onChange={(e) => setAdjustDate(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Reason / Notes</Label>
                  <Input
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="Purchase, dispensed, etc."
                  />
                </div>
              </div>

              {/* Movement History */}
              {(allMovements ?? []).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Movement History</p>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left px-3 py-2">Date</th>
                          <th className="text-left px-3 py-2">Type</th>
                          <th className="text-right px-3 py-2">In</th>
                          <th className="text-right px-3 py-2">Out</th>
                          <th className="text-right px-3 py-2">Balance</th>
                          <th className="text-left px-3 py-2">Ref</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(allMovements ?? []).map((mv: StockMovement) => (
                          <tr
                            key={mv.id.toString()}
                            className="hover:bg-muted/20"
                          >
                            <td className="px-3 py-1.5">
                              {formatDate(mv.date)}
                            </td>
                            <td className="px-3 py-1.5">
                              <Badge
                                className={
                                  mv.type === "Add"
                                    ? "bg-green-100 text-green-800 text-xs"
                                    : mv.type === "Remove"
                                      ? "bg-red-100 text-red-800 text-xs"
                                      : "bg-blue-100 text-blue-800 text-xs"
                                }
                              >
                                {mv.type}
                              </Badge>
                            </td>
                            <td className="px-3 py-1.5 text-right text-green-700">
                              {mv.qtyIn || "—"}
                            </td>
                            <td className="px-3 py-1.5 text-right text-red-600">
                              {mv.qtyOut || "—"}
                            </td>
                            <td className="px-3 py-1.5 text-right font-medium">
                              {mv.balance}
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">
                              {mv.reference || mv.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustMed(null)}
              data-ocid="medicines.adjust.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjust}
              className="bg-primary text-primary-foreground"
              data-ocid="medicines.adjust.confirm_button"
            >
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="medicines.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this medicine from inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="medicines.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteMedicine.mutateAsync(deleteId!);
                  toast.success("Medicine deleted");
                } catch {
                  toast.error("Failed");
                } finally {
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
              data-ocid="medicines.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
