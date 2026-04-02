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
import { useNavigate } from "@tanstack/react-router";
import {
  Edit,
  Eye,
  FileSpreadsheet,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Gender,
  type Patient,
  useAddPatient,
  useAllVisits,
  useDeletePatient,
  useSearchPatients,
  useUpdatePatient,
} from "../hooks/useQueries";
import { INDIA_STATES } from "../utils/constants";
import { formatDate } from "../utils/formatters";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EMPTY_FORM = {
  name: "",
  age: "",
  dob: "",
  gender: Gender.male as "male" | "female" | "other",
  bloodGroup: "",
  phone: "",
  altPhone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  occupation: "",
  referredBy: "",
  chiefComplaints: "",
  medicalHistory: "",
  familyHistory: "",
  allergies: "",
  isActive: true,
};

const PAGE_SIZE = 10;

export default function Patients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [importErrors, setImportErrors] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("active");

  const activeOnly =
    activeFilter === "all" ? undefined : activeFilter === "active";
  const { data: patients } = useSearchPatients(debouncedTerm, activeOnly);
  const { data: allVisits } = useAllVisits();
  const addPatient = useAddPatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  useEffect(() => {
    const handler = () => openAdd();
    window.addEventListener("shortcut:new-patient", handler);
    return () => window.removeEventListener("shortcut:new-patient", handler);
  }, []);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => {
      setDebouncedTerm(val);
      setPage(1);
    }, 300);
  };

  const openAdd = () => {
    setEditPatient(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditPatient(p);
    setForm({
      name: p.name,
      age: p.age.toString(),
      dob: p.dob ?? "",
      gender: p.gender,
      bloodGroup: p.bloodGroup ?? "",
      phone: p.phone,
      altPhone: p.altPhone ?? "",
      email: p.email ?? "",
      address: p.address,
      city: p.city ?? "",
      state: p.state,
      pincode: p.pincode ?? "",
      occupation: p.occupation ?? "",
      referredBy: p.referredBy ?? "",
      chiefComplaints: p.chiefComplaints,
      medicalHistory: p.medicalHistory,
      familyHistory: p.familyHistory ?? "",
      allergies: p.allergies ?? "",
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  // Auto-compute age from DOB
  const handleDobChange = (dob: string) => {
    setForm((f) => {
      const age = dob
        ? String(new Date().getFullYear() - new Date(dob).getFullYear())
        : f.age;
      return { ...f, dob, age };
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast.error("Name and phone are required");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      toast.error("Phone must be 10 digits");
      return;
    }
    if (!form.chiefComplaints) {
      toast.error("Chief complaints are required");
      return;
    }
    try {
      const data = {
        name: form.name,
        age: BigInt(form.age || "0"),
        dob: form.dob || undefined,
        gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        phone: form.phone,
        altPhone: form.altPhone || undefined,
        email: form.email || undefined,
        address: form.address,
        city: form.city || undefined,
        state: form.state,
        pincode: form.pincode || undefined,
        occupation: form.occupation || undefined,
        referredBy: form.referredBy || undefined,
        chiefComplaints: form.chiefComplaints,
        medicalHistory: form.medicalHistory,
        familyHistory: form.familyHistory || undefined,
        allergies: form.allergies || undefined,
        isActive: form.isActive,
      };
      if (editPatient) {
        await updatePatient.mutateAsync({ id: editPatient.id, patient: data });
        toast.success("Patient updated");
      } else {
        await addPatient.mutateAsync(data);
        toast.success("Patient added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save patient");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePatient.mutateAsync(deleteId);
      toast.success("Patient deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  // Get last visit per patient
  const lastVisitMap = new Map<string, bigint>();
  for (const v of allVisits ?? []) {
    const key = v.patientId.toString();
    const existing = lastVisitMap.get(key);
    if (!existing || v.visitDate > existing) lastVisitMap.set(key, v.visitDate);
  }

  const paginatedPatients = (patients ?? []).slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const totalPages = Math.ceil((patients ?? []).length / PAGE_SIZE);

  const EXCEL_HEADERS = [
    "Name",
    "Age",
    "DOB",
    "Gender",
    "Blood Group",
    "Phone",
    "Alt Phone",
    "Email",
    "Address",
    "City",
    "State",
    "Pincode",
    "Occupation",
    "Referred By",
    "Chief Complaints",
    "Medical History",
    "Family History",
    "Allergies",
  ];

  const handleDownloadTemplate = () => {
    const sampleRow = [
      "Ramesh Gupta",
      "45",
      "1980-05-15",
      "male",
      "O+",
      "9812345678",
      "",
      "ramesh@example.com",
      "123 MG Road",
      "Mumbai",
      "Maharashtra",
      "400001",
      "Teacher",
      "Dr. Sharma",
      "Chronic headache",
      "Hypertension",
      "None",
      "None",
    ];
    const rows = [EXCEL_HEADERS, sampleRow];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded (CSV)");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          toast.error("No data rows found");
          return;
        }
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let cur = "";
          let inQ = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
              inQ = !inQ;
            } else if (c === "," && !inQ) {
              result.push(cur.trim());
              cur = "";
            } else {
              cur += c;
            }
          }
          result.push(cur.trim());
          return result;
        };
        const headers = parseCSVLine(lines[0]);
        const dataRows = lines
          .slice(1)
          .map(parseCSVLine)
          .filter((r) => r.some((c) => c));
        const mapped: Record<string, string>[] = dataRows.map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            obj[h] = (row[i] ?? "").trim();
          });
          return obj;
        });
        const errors: number[] = [];
        mapped.forEach((row, idx) => {
          if (!row.Name || !row.Phone) errors.push(idx);
        });
        setImportRows(mapped);
        setImportErrors(errors);
        setImportStep(2);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validRows = importRows.filter((_, i) => !importErrors.includes(i));
    for (const row of validRows) {
      await addPatient.mutateAsync({
        name: row.Name || "",
        age: BigInt(Number.parseInt(row.Age || "0") || 0),
        gender: (["male", "female", "other"].includes(
          (row.Gender || "male").toLowerCase(),
        )
          ? (row.Gender || "male").toLowerCase()
          : "male") as "male" | "female" | "other",
        phone: row.Phone || "",
        address: row.Address || "",
        state: row.State || "",
        chiefComplaints: row["Chief Complaints"] || "",
        medicalHistory: row["Medical History"] || "",
        dob: row.DOB || undefined,
        bloodGroup: row["Blood Group"] || undefined,
        altPhone: row["Alt Phone"] || undefined,
        email: row.Email || undefined,
        city: row.City || undefined,
        pincode: row.Pincode || undefined,
        occupation: row.Occupation || undefined,
        referredBy: row["Referred By"] || undefined,
        familyHistory: row["Family History"] || undefined,
        allergies: row.Allergies || undefined,
      });
    }
    toast.success(`${validRows.length} patients imported successfully`);
    setImportOpen(false);
    setImportStep(1);
    setImportRows([]);
    setImportErrors([]);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Patients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {(patients ?? []).length} patients
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setImportOpen(true);
              setImportStep(1);
            }}
            className="gap-2"
            data-ocid="patients.import_button"
          >
            <Upload className="w-4 h-4" /> Import Excel
          </Button>
          <Button
            onClick={openAdd}
            className="bg-primary text-primary-foreground gap-2"
            data-ocid="patients.add_button"
          >
            <Plus className="w-4 h-4" /> New Patient
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name, code, phone, city..."
            className="pl-9"
            data-ocid="patients.search_input"
          />
        </div>
        <div className="flex gap-1">
          {(["active", "inactive", "all"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={activeFilter === f ? "default" : "outline"}
              className={
                activeFilter === f ? "bg-primary text-primary-foreground" : ""
              }
              onClick={() => {
                setActiveFilter(f);
                setPage(1);
              }}
              data-ocid={`patients.filter.${f}.tab`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
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
                    Code
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Mobile
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Age/Gender
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    City
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Chief Complaint
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Last Visit
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
                {paginatedPatients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground"
                      data-ocid="patients.empty_state"
                    >
                      No patients found
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map((p, i) => {
                    const lastVisit = lastVisitMap.get(p.id.toString());
                    return (
                      <tr
                        key={p.id.toString()}
                        className="hover:bg-muted/20"
                        data-ocid={`patients.item.${i + 1}`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            {p.patientCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3">{p.phone}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {Number(p.age)} yrs ·{" "}
                          <Badge
                            variant="outline"
                            className="capitalize text-xs"
                          >
                            {p.gender}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.city || p.state || "—"}
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="truncate text-xs text-muted-foreground">
                            {p.chiefComplaints || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {lastVisit ? formatDate(lastVisit) : "No visits"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              p.isActive
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }
                          >
                            {p.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <a
                              href={`https://wa.me/91${p.phone}?text=${encodeURIComponent(`Dear ${p.name}, reminder from Dr. Sharma's Homeopathy Clinic. Call 9876543210.`)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </a>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() =>
                                navigate({
                                  to: "/patients/$patientId",
                                  params: { patientId: p.id.toString() },
                                })
                              }
                              data-ocid={`patients.view_button.${i + 1}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(p)}
                              data-ocid={`patients.edit_button.${i + 1}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(p.id)}
                              data-ocid={`patients.delete_button.${i + 1}`}
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
                  data-ocid="patients.pagination_prev"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  data-ocid="patients.pagination_next"
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
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="patients.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editPatient ? "Edit Patient" : "New Patient"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Patient's full name"
                  data-ocid="patients.name.input"
                />
              </div>
              {/* Gender + DOB */}
              <div className="space-y-1.5">
                <Label>Gender *</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      gender: v as "male" | "female" | "other",
                    }))
                  }
                >
                  <SelectTrigger data-ocid="patients.gender.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={form.dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  data-ocid="patients.dob.input"
                />
              </div>
              {/* Age + Blood Group */}
              <div className="space-y-1.5">
                <Label>Age (years)</Label>
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, age: e.target.value }))
                  }
                  placeholder="Auto from DOB"
                  data-ocid="patients.age.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Blood Group</Label>
                <Select
                  value={form.bloodGroup || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, bloodGroup: v }))
                  }
                >
                  <SelectTrigger data-ocid="patients.blood.select">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Phone */}
              <div className="space-y-1.5">
                <Label>Mobile * (10 digits)</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="9876543210"
                  maxLength={10}
                  data-ocid="patients.phone.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Alternate Mobile</Label>
                <Input
                  value={form.altPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, altPhone: e.target.value }))
                  }
                  placeholder="Optional"
                  maxLength={10}
                  data-ocid="patients.alt_phone.input"
                />
              </div>
              {/* Email */}
              <div className="col-span-2 space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="patient@email.com"
                  data-ocid="patients.email.input"
                />
              </div>
              {/* Address */}
              <div className="col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Street, locality"
                  data-ocid="patients.address.input"
                />
              </div>
              {/* City + State + Pincode */}
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="City"
                  data-ocid="patients.city.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select
                  value={form.state}
                  onValueChange={(v) => setForm((f) => ({ ...f, state: v }))}
                >
                  <SelectTrigger data-ocid="patients.state.select">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {INDIA_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input
                  value={form.pincode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pincode: e.target.value }))
                  }
                  placeholder="400001"
                  maxLength={6}
                  data-ocid="patients.pincode.input"
                />
              </div>
              {/* Occupation + Referred */}
              <div className="space-y-1.5">
                <Label>Occupation</Label>
                <Input
                  value={form.occupation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, occupation: e.target.value }))
                  }
                  placeholder="Profession"
                  data-ocid="patients.occupation.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Referred By</Label>
                <Input
                  value={form.referredBy}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, referredBy: e.target.value }))
                  }
                  placeholder="Doctor / Patient name"
                  data-ocid="patients.referred.input"
                />
              </div>
              {/* Medical history fields */}
              <div className="col-span-2 space-y-1.5">
                <Label>Chief Complaints *</Label>
                <Textarea
                  value={form.chiefComplaints}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, chiefComplaints: e.target.value }))
                  }
                  placeholder="Primary symptoms and concerns"
                  rows={2}
                  data-ocid="patients.complaints.textarea"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Past Medical History</Label>
                <Textarea
                  value={form.medicalHistory}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, medicalHistory: e.target.value }))
                  }
                  placeholder="Past illnesses, surgeries"
                  rows={2}
                  data-ocid="patients.history.textarea"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Family History</Label>
                <Textarea
                  value={form.familyHistory}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, familyHistory: e.target.value }))
                  }
                  placeholder="Family medical history"
                  rows={2}
                  data-ocid="patients.family_history.textarea"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Allergies</Label>
                <Textarea
                  value={form.allergies}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, allergies: e.target.value }))
                  }
                  placeholder="Known drug/food allergies"
                  rows={2}
                  data-ocid="patients.allergies.textarea"
                />
              </div>
              {/* Active toggle (edit only) */}
              {editPatient && (
                <div className="col-span-2 flex items-center gap-3">
                  <Switch
                    id="patient-active"
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, isActive: v }))
                    }
                  />
                  <Label htmlFor="patient-active">Active Patient</Label>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="patients.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground"
              data-ocid="patients.submit_button"
            >
              {editPatient ? "Update Patient" : "Add Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="patients.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the patient and all associated
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="patients.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="patients.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Import Excel Dialog */}
      <Dialog
        open={importOpen}
        onOpenChange={(o) => {
          setImportOpen(o);
          if (!o) {
            setImportStep(1);
            setImportRows([]);
            setImportErrors([]);
          }
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="patients.import.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" /> Import Patients from Excel
            </DialogTitle>
          </DialogHeader>
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${importStep >= s ? "bg-primary text-primary-foreground border-primary" : "border-muted text-muted-foreground"}`}
                >
                  {s}
                </div>
                <span
                  className={`text-sm ${importStep === s ? "font-semibold" : "text-muted-foreground"}`}
                >
                  {s === 1
                    ? "Download Template"
                    : s === 2
                      ? "Upload & Preview"
                      : "Confirm Import"}
                </span>
                {s < 3 && <div className="w-8 h-0.5 bg-border" />}
              </div>
            ))}
          </div>

          {importStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download the Excel template, fill in patient data, and upload it
                back.
              </p>
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Template Headers
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "Name *",
                      "Age",
                      "DOB",
                      "Gender",
                      "Blood Group",
                      "Phone *",
                      "Alt Phone",
                      "Email",
                      "Address",
                      "City",
                      "State",
                      "Pincode",
                      "Occupation",
                      "Referred By",
                      "Chief Complaints",
                      "Medical History",
                      "Family History",
                      "Allergies",
                    ].map((h) => (
                      <Badge key={h} variant="outline" className="text-xs">
                        {h}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Required fields. Gender: male/female/other
                  </p>
                </CardContent>
              </Card>
              <Button
                onClick={handleDownloadTemplate}
                className="gap-2 bg-primary text-primary-foreground"
                data-ocid="patients.import.download_button"
              >
                <FileSpreadsheet className="w-4 h-4" /> Download Template
              </Button>
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">
                  Already have the file? Upload directly:
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  data-ocid="patients.import.upload_button"
                />
              </div>
            </div>
          )}

          {importStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className="bg-green-100 text-green-800">
                  {importRows.length - importErrors.length} valid rows
                </Badge>
                {importErrors.length > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    {importErrors.length} rows with errors
                  </Badge>
                )}
                <label className="cursor-pointer text-sm text-primary underline">
                  Change file
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Phone</th>
                      <th className="px-3 py-2 text-left">Age</th>
                      <th className="px-3 py-2 text-left">Gender</th>
                      <th className="px-3 py-2 text-left">City</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importRows.slice(0, 10).map((row, i) => (
                      <tr
                        // biome-ignore lint/suspicious/noArrayIndexKey: stable import preview
                        key={i}
                        className={importErrors.includes(i) ? "bg-red-50" : ""}
                        data-ocid={`patients.import.preview.item.${i + 1}`}
                      >
                        <td className="px-3 py-2 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td
                          className={`px-3 py-2 font-medium ${!row.Name ? "text-red-600" : ""}`}
                        >
                          {row.Name || "⚠ Missing"}
                        </td>
                        <td
                          className={`px-3 py-2 ${!row.Phone ? "text-red-600" : ""}`}
                        >
                          {row.Phone || "⚠ Missing"}
                        </td>
                        <td className="px-3 py-2">{row.Age || "—"}</td>
                        <td className="px-3 py-2">{row.Gender || "—"}</td>
                        <td className="px-3 py-2">{row.City || "—"}</td>
                        <td className="px-3 py-2">
                          {importErrors.includes(i) ? (
                            <Badge className="bg-red-100 text-red-800">
                              Error
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              Valid
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importRows.length > 10 && (
                  <p className="text-xs text-muted-foreground px-3 py-2">
                    ... and {importRows.length - 10} more rows
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportStep(1)}
                  data-ocid="patients.import.back_button"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setImportStep(3)}
                  className="bg-primary text-primary-foreground"
                  disabled={importRows.length - importErrors.length === 0}
                  data-ocid="patients.import.next_button"
                >
                  Next: Review Import
                </Button>
              </div>
            </div>
          )}

          {importStep === 3 && (
            <div className="space-y-4">
              <Card className="shadow-card">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium">Import Summary</p>
                  <p className="text-sm text-muted-foreground">
                    Total rows: {importRows.length}
                  </p>
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Valid: {importRows.length - importErrors.length} patients
                    will be imported
                  </p>
                  {importErrors.length > 0 && (
                    <p className="text-sm text-red-600">
                      ✗ Skipped: {importErrors.length} rows with errors (missing
                      Name or Phone)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Patient codes will be auto-generated (HC-XXXXX format)
                  </p>
                </CardContent>
              </Card>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportStep(2)}
                  data-ocid="patients.import.back2_button"
                >
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  className="bg-primary text-primary-foreground gap-2"
                  data-ocid="patients.import.confirm_button"
                >
                  <Upload className="w-4 h-4" /> Import{" "}
                  {importRows.length - importErrors.length} Patients
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
