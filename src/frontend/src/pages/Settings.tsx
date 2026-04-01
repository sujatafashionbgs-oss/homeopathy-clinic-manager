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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type MedicineCategory,
  type User,
  useAddMedicineCategory,
  useAddUser,
  useClinicSettings,
  useDeleteMedicineCategory,
  useMedicineCategories,
  useUpdateClinicSettings,
  useUpdateMedicineCategory,
  useUpdateUser,
  useUsers,
} from "../hooks/useQueries";
import { useAuthStore } from "../store/authStore";

const GST_RATES = [0, 5, 12, 18];

export default function Settings() {
  const { data: settings } = useClinicSettings();
  const updateSettings = useUpdateClinicSettings();
  const authUser = useAuthStore((s) => s.user);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    clinicName: "",
    doctorName: "",
    qualification: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    registrationNumber: "",
    gstNumber: "",
    enableGST: true,
    gstPercent: 18,
    currency: "INR",
    logoUrl: "",
  });

  useEffect(() => {
    if (settings)
      setForm({
        ...settings,
        logoUrl: settings.logoUrl ?? "",
        gstPercent: settings.gstPercent ?? 18,
        currency: settings.currency ?? "INR",
      });
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm((f) => ({ ...f, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold">Clinic Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage clinic info, users and medicine categories
        </p>
      </div>

      <Tabs defaultValue="clinic">
        <TabsList data-ocid="settings.tab">
          <TabsTrigger value="clinic" data-ocid="settings.clinic.tab">
            Clinic Info
          </TabsTrigger>
          {authUser?.role === "Admin" && (
            <TabsTrigger value="users" data-ocid="settings.users.tab">
              User Management
            </TabsTrigger>
          )}
          <TabsTrigger value="categories" data-ocid="settings.categories.tab">
            Medicine Categories
          </TabsTrigger>
        </TabsList>

        {/* Clinic Info Tab */}
        <TabsContent value="clinic" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-heading">
                Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo Upload */}
                <div className="md:col-span-2 space-y-2">
                  <Label>Clinic Logo</Label>
                  <div className="flex items-center gap-4">
                    {form.logoUrl ? (
                      <img
                        src={form.logoUrl}
                        alt="Clinic logo"
                        className="h-16 w-16 object-contain rounded border bg-muted"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No Logo
                      </div>
                    )}
                    <div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        data-ocid="settings.logo.upload_button"
                      >
                        {form.logoUrl ? "Change Logo" : "Upload Logo"}
                      </Button>
                      {form.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive ml-2"
                          onClick={() =>
                            setForm((f) => ({ ...f, logoUrl: "" }))
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text fields */}
                {(
                  [
                    ["clinicName", "Clinic Name", "text"],
                    ["doctorName", "Doctor Name", "text"],
                    ["qualification", "Qualification", "text"],
                    ["phone", "Phone", "text"],
                    ["email", "Email", "email"],
                    ["website", "Website", "text"],
                    ["registrationNumber", "Registration Number", "text"],
                    ["gstNumber", "GST Number", "text"],
                  ] as [keyof typeof form, string, string][]
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input
                      value={(form[field] as string) ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [field]: e.target.value }))
                      }
                      data-ocid={`settings.${field}.input`}
                    />
                  </div>
                ))}

                <div className="md:col-span-2 space-y-1.5">
                  <Label>Address</Label>
                  <Textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    rows={2}
                    data-ocid="settings.address.textarea"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, currency: v }))
                    }
                  >
                    <SelectTrigger data-ocid="settings.currency.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* GST Toggle + Percent */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="gst-enable"
                      checked={form.enableGST}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, enableGST: v }))
                      }
                      data-ocid="settings.gst.switch"
                    />
                    <Label htmlFor="gst-enable">Enable GST on invoices</Label>
                  </div>
                  {form.enableGST && (
                    <div className="space-y-1.5">
                      <Label>Default GST Rate (%)</Label>
                      <Select
                        value={form.gstPercent.toString()}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, gstPercent: Number(v) }))
                        }
                      >
                        <SelectTrigger
                          className="w-32"
                          data-ocid="settings.gst_percent.select"
                        >
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
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleSave}
                  className="bg-primary text-primary-foreground gap-2"
                  data-ocid="settings.save_button"
                >
                  <Save className="w-4 h-4" /> Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        {authUser?.role === "Admin" && (
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
        )}

        {/* Medicine Categories Tab */}
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: users } = useUsers();
  const addUser = useAddUser();
  const updateUser = useUpdateUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Receptionist" as "Admin" | "Receptionist",
  });

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: "", email: "", password: "", role: "Receptionist" });
    setModalOpen(true);
  };
  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and email required");
      return;
    }
    try {
      if (editUser) {
        await updateUser.mutateAsync({ id: editUser.id, user: form });
        toast.success("User updated");
      } else {
        await addUser.mutateAsync({ ...form, isActive: true });
        toast.success("User added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground gap-2"
          data-ocid="settings.add_user.button"
        >
          <Plus className="w-4 h-4" /> Add User
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
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Role
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
              {(users ?? []).map((u, i) => (
                <tr
                  key={u.id.toString()}
                  className="hover:bg-muted/20"
                  data-ocid={`settings.users.item.${i + 1}`}
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        u.role === "Admin"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        u.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(u)}
                        data-ocid={`settings.users.edit_button.${i + 1}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() =>
                          updateUser
                            .mutateAsync({
                              id: u.id,
                              user: { isActive: !u.isActive },
                            })
                            .then(() => toast.success("Updated"))
                        }
                      >
                        {u.isActive ? (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            Deactivate
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Activate
                          </Badge>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm" data-ocid="settings.user.modal">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editUser ? "Edit User" : "Add User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    role: v as "Admin" | "Receptionist",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Receptionist">Receptionist</SelectItem>
                </SelectContent>
              </Select>
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
              {editUser ? "Update" : "Add User"}
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
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => setDeleteId(null)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Categories Tab ──────────────────────────────────────────────────────────

function CategoriesTab() {
  const { data: cats } = useMedicineCategories();
  const addCat = useAddMedicineCategory();
  const updateCat = useUpdateMedicineCategory();
  const deleteCat = useDeleteMedicineCategory();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<MedicineCategory | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const openAdd = () => {
    setEditCat(null);
    setForm({ name: "", description: "" });
    setModalOpen(true);
  };
  const openEdit = (c: MedicineCategory) => {
    setEditCat(c);
    setForm({ name: c.name, description: c.description });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Category name required");
      return;
    }
    try {
      if (editCat) {
        await updateCat.mutateAsync({ id: editCat.id, category: form });
        toast.success("Category updated");
      } else {
        await addCat.mutateAsync(form);
        toast.success("Category added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground gap-2"
          data-ocid="settings.add_category.button"
        >
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Category Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Description
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(cats ?? []).map((c, i) => (
                <tr
                  key={c.id.toString()}
                  className="hover:bg-muted/20"
                  data-ocid={`settings.categories.item.${i + 1}`}
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.description}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(c)}
                        data-ocid={`settings.categories.edit_button.${i + 1}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(c.id)}
                        data-ocid={`settings.categories.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm" data-ocid="settings.category.modal">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editCat ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
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
              {editCat ? "Update" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="settings.category.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => {
                try {
                  await deleteCat.mutateAsync(deleteId!);
                  toast.success("Deleted");
                } catch {
                  toast.error("Failed");
                } finally {
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
