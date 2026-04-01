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
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Expense,
  useAddExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
} from "../hooks/useQueries";
import {
  formatDate,
  formatRupees,
  nowNanoseconds,
  toNanoseconds,
} from "../utils/formatters";

const BASE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Salary",
  "Telephone",
  "Cleaning",
  "Miscellaneous",
];
const ALL_CATEGORIES = ["All", ...BASE_CATEGORIES, "Custom"];
const PAYMENT_MODES = [
  "Cash",
  "UPI",
  "Card",
  "Cheque",
  "Bank Transfer",
  "Net Banking",
];
const PAGE_SIZE = 10;

const EMPTY_FORM = {
  category: "Miscellaneous",
  customCategory: "",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  paidTo: "",
  paymentMode: "Cash",
  referenceNo: "",
  notes: "",
};

export default function Expenses() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterCategory, setFilterCategory] = useState("All");
  const [page, setPage] = useState(1);

  const { data: expenses } = useExpenses();
  const addExpense = useAddExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const filtered = (expenses ?? []).filter(
    (e) => filterCategory === "All" || e.category === filterCategory,
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  const openAdd = () => {
    setEditExpense(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditExpense(e);
    setForm({
      category: BASE_CATEGORIES.includes(e.category) ? e.category : "Custom",
      customCategory: BASE_CATEGORIES.includes(e.category) ? "" : e.category,
      description: e.description,
      amount: e.amount.toString(),
      date: new Date(Number(e.date) / 1_000_000).toISOString().split("T")[0],
      paidTo: e.paidTo,
      paymentMode: e.paymentMode ?? "Cash",
      referenceNo: e.referenceNo ?? "",
      notes: e.notes,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.description || !form.amount) {
      toast.error("Description and amount are required");
      return;
    }
    const finalCategory =
      form.category === "Custom"
        ? form.customCategory || "Custom"
        : form.category;
    try {
      const data = {
        category: finalCategory,
        description: form.description,
        amount: Number.parseFloat(form.amount) || 0,
        date: form.date ? toNanoseconds(form.date) : nowNanoseconds(),
        paidTo: form.paidTo,
        paymentMode: form.paymentMode || undefined,
        referenceNo: form.referenceNo || undefined,
        notes: form.notes,
      };
      if (editExpense) {
        await updateExpense.mutateAsync({ id: editExpense.id, expense: data });
        toast.success("Expense updated");
      } else {
        await addExpense.mutateAsync(data);
        toast.success("Expense added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered.length} records · Total:{" "}
            <strong>{formatRupees(totalAmount)}</strong>
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground gap-2"
          data-ocid="expenses.add_button"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {ALL_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={filterCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterCategory(cat);
              setPage(1);
            }}
            className={
              filterCategory === cat ? "bg-primary text-primary-foreground" : ""
            }
            data-ocid={`expenses.filter.${cat.toLowerCase()}.tab`}
          >
            {cat}
          </Button>
        ))}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Paid To
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Mode
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                      data-ocid="expenses.empty_state"
                    >
                      No expenses recorded
                    </td>
                  </tr>
                ) : (
                  paginated.map((e, i) => (
                    <tr
                      key={e.id.toString()}
                      className="hover:bg-muted/20"
                      data-ocid={`expenses.item.${i + 1}`}
                    >
                      <td className="px-4 py-3">{formatDate(e.date)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">{e.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {e.paidTo || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {e.paymentMode || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatRupees(e.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEdit(e)}
                            data-ocid={`expenses.edit_button.${i + 1}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(e.id)}
                            data-ocid={`expenses.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
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
                  data-ocid="expenses.pagination_prev"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  data-ocid="expenses.pagination_next"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" data-ocid="expenses.modal">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editExpense ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger data-ocid="expenses.category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="Custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.category === "Custom" && (
              <div className="space-y-1.5">
                <Label>Custom Category Name</Label>
                <Input
                  value={form.customCategory}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customCategory: e.target.value }))
                  }
                  placeholder="Enter category"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Expense description"
                data-ocid="expenses.description.input"
              />
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
                  placeholder="0.00"
                  data-ocid="expenses.amount.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="expenses.date.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Paid To</Label>
              <Input
                value={form.paidTo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paidTo: e.target.value }))
                }
                placeholder="Person or organization"
                data-ocid="expenses.paidto.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <Select
                  value={form.paymentMode}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, paymentMode: v }))
                  }
                >
                  <SelectTrigger data-ocid="expenses.mode.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reference No.</Label>
                <Input
                  value={form.referenceNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, referenceNo: e.target.value }))
                  }
                  placeholder="Cheque/UPI ref"
                  data-ocid="expenses.ref.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                data-ocid="expenses.notes.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="expenses.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground"
              data-ocid="expenses.submit_button"
            >
              {editExpense ? "Update" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="expenses.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="expenses.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteExpense.mutateAsync(deleteId!);
                  toast.success("Expense deleted");
                } catch {
                  toast.error("Failed");
                } finally {
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
              data-ocid="expenses.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
