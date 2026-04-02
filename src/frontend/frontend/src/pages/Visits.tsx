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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Download,
  Edit,
  FileSpreadsheet,
  History,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  type PrescriptionItem,
  type Visit,
  useAddVisit,
  useAllMedicines,
  useAllVisits,
  useClinicSettings,
  useDeleteVisit,
  useSearchPatients,
  useUpdateVisit,
} from "../hooks/useQueries";
import {
  formatDate,
  nowNanoseconds,
  toDateInputValue,
  toNanoseconds,
} from "../utils/formatters";

const EMPTY_RX_ROW = (): PrescriptionItem => ({
  medicineName: "",
  potency: "",
  quantity: "",
  unit: "globules",
  dosage: "",
  durationDays: 7,
  notes: "",
});

const EMPTY_FORM = {
  patientId: "",
  visitType: "New" as "New" | "Follow-up" | "Emergency",
  visitDate: new Date().toISOString().split("T")[0],
  visitTime: "",
  weight: "",
  bp: "",
  temperature: "",
  chiefComplaints: "",
  examination: "",
  diagnosis: "",
  prescription: "",
  medicinePrescribed: "",
  followUpDate: "",
  notes: "",
  prescriptionInstructions: "",
  prescriptionItems: [EMPTY_RX_ROW()] as PrescriptionItem[],
};

const PAGE_SIZE = 10;

export default function Visits() {
  const [modalOpen, setModalOpen] = useState(false);
  const [printVisit, setPrintVisit] = useState<Visit | null>(null);
  const [editVisit, setEditVisit] = useState<Visit | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterPatient, setFilterPatient] = useState("all");
  const [page, setPage] = useState(1);
  const [revisitPatientId, setRevisitPatientId] = useState<bigint | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [patientSearch, setPatientSearch] = useState("");

  const { data: visits } = useAllVisits();
  const { data: patients } = useSearchPatients("");
  const { data: medicines } = useAllMedicines();
  const { data: settings } = useClinicSettings();
  const addVisit = useAddVisit();
  const updateVisit = useUpdateVisit();
  const deleteVisit = useDeleteVisit();

  useEffect(() => {
    const handler = () => openAdd();
    window.addEventListener("shortcut:new-visit", handler);
    return () => window.removeEventListener("shortcut:new-visit", handler);
  }, []);

  const filtered = (visits ?? []).filter(
    (v) => filterPatient === "all" || v.patientId.toString() === filterPatient,
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const patientMap = new Map((patients ?? []).map((p) => [p.id.toString(), p]));

  const filteredPatients = patientSearch
    ? (patients ?? []).filter(
        (p) =>
          p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.patientCode.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.phone.includes(patientSearch),
      )
    : (patients ?? []);

  const openAdd = () => {
    setEditVisit(null);
    setRevisitPatientId(null);
    setForm(EMPTY_FORM);
    setPatientSearch("");
    setModalOpen(true);
  };

  const openEdit = (v: Visit) => {
    setRevisitPatientId(null);
    setEditVisit(v);
    setForm({
      patientId: v.patientId.toString(),
      visitType: v.visitType ?? "New",
      visitDate: toDateInputValue(v.visitDate),
      visitTime: v.visitTime ?? "",
      weight: v.weight ?? "",
      bp: v.bp ?? "",
      temperature: v.temperature ?? "",
      chiefComplaints: v.chiefComplaints,
      examination: v.examination,
      diagnosis: v.diagnosis,
      prescription: v.prescription,
      medicinePrescribed: v.medicinePrescribed,
      followUpDate: v.followUpDate ? toDateInputValue(v.followUpDate) : "",
      notes: v.notes,
      prescriptionInstructions: v.prescriptionInstructions ?? "",
      prescriptionItems: v.prescriptionItems?.length
        ? v.prescriptionItems
        : [EMPTY_RX_ROW()],
    });
    setModalOpen(true);
  };

  const openRevisit = (v: Visit) => {
    const patient = patientMap.get(v.patientId.toString());
    setEditVisit(null);
    setRevisitPatientId(v.patientId);
    setHistoryOpen(true);
    setForm({
      ...EMPTY_FORM,
      patientId: v.patientId.toString(),
      visitType: "Follow-up",
    });
    setPatientSearch(patient ? `${patient.name} (${patient.patientCode})` : "");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.patientId || !form.chiefComplaints) {
      toast.error("Patient and chief complaints are required");
      return;
    }
    try {
      const rxItems = form.prescriptionItems.filter((r) =>
        r.medicineName.trim(),
      );
      const data = {
        patientId: BigInt(form.patientId),
        visitType: form.visitType,
        visitDate: form.visitDate
          ? toNanoseconds(form.visitDate)
          : nowNanoseconds(),
        visitTime: form.visitTime || undefined,
        weight: form.weight || undefined,
        bp: form.bp || undefined,
        temperature: form.temperature || undefined,
        chiefComplaints: form.chiefComplaints,
        symptoms: form.chiefComplaints,
        examination: form.examination,
        diagnosis: form.diagnosis,
        diagnosisNotes: form.diagnosis || undefined,
        prescription: form.prescription,
        prescriptionItems: rxItems.length ? rxItems : undefined,
        prescriptionInstructions: form.prescriptionInstructions || undefined,
        medicinePrescribed:
          form.medicinePrescribed ||
          rxItems.map((r) => `${r.medicineName} ${r.potency}`).join(", "),
        followUpDate: form.followUpDate
          ? toNanoseconds(form.followUpDate)
          : null,
        notes: form.notes,
        generalNotes: form.notes || undefined,
      };
      if (editVisit) {
        await updateVisit.mutateAsync({ id: editVisit.id, visit: data });
        toast.success("Visit updated");
      } else {
        await addVisit.mutateAsync(data);
        toast.success("Visit recorded");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save visit");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVisit.mutateAsync(deleteId);
      toast.success("Visit deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const handlePrint = (v: Visit) => {
    setPrintVisit(v);
  };

  useEffect(() => {
    if (!printVisit) return;
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    const afterPrint = () => {
      setPrintVisit(null);
    };
    window.addEventListener("afterprint", afterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, [printVisit]);

  const handlePdfDownload = (v: Visit) => {
    const patient = patientMap.get(v.patientId.toString());
    const clinicName = settings?.clinicName || "Homeopathy Clinic";
    const doctorName = settings?.doctorName || "";
    const address = settings?.address || "";
    const phone = settings?.phone || "";
    const rxRows = (v.prescriptionItems ?? [])
      .map(
        (rx) =>
          `<tr style="border-bottom:1px solid #ddd"><td style="padding:4px">${rx.medicineName}</td><td style="padding:4px;text-align:center">${rx.potency}</td><td style="padding:4px;text-align:center">${rx.quantity} ${rx.unit}</td><td style="padding:4px;text-align:center">${rx.dosage}</td><td style="padding:4px;text-align:center">${rx.durationDays ?? ""}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><title>Prescription - ${patient?.name ?? ""}</title><style>body{font-family:Arial,sans-serif;font-size:12pt;padding:20px;color:#000}table{width:100%;border-collapse:collapse}th{border-bottom:2px solid #333;padding:4px;text-align:left}hr{margin:8px 0}</style></head><body>
      <div style="text-align:center;border-bottom:1px solid #333;padding-bottom:8px;margin-bottom:12px">
        <h2 style="margin:0">${clinicName}</h2>
        <p style="margin:2px 0">${doctorName}</p>
        <p style="margin:2px 0">${address}</p>
        <p style="margin:2px 0">${phone}</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:12px;font-size:11pt">
        <p><b>Patient:</b> ${patient?.name ?? "Unknown"} (${patient?.patientCode ?? ""})</p>
        <p><b>Date:</b> ${new Date(Number(v.visitDate) / 1000000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
        <p><b>Age/Gender:</b> ${Number(patient?.age ?? 0)} yrs / ${patient?.gender ?? ""}</p>
        <p><b>Visit Type:</b> ${v.visitType ?? "New"}</p>
        ${v.bp ? `<p><b>BP:</b> ${v.bp} mmHg</p>` : ""}
        ${v.weight ? `<p><b>Weight:</b> ${v.weight}</p>` : ""}
      </div>
      <p><b>Chief Complaints:</b> ${v.chiefComplaints}</p>
      ${v.diagnosis ? `<p><b>Diagnosis:</b> ${v.diagnosis}</p>` : ""}
      <div style="border-top:1px solid #333;margin-top:8px;padding-top:8px">
        <p style="font-size:14pt;font-weight:bold">&#8478; Prescription</p>
        ${rxRows ? `<table><thead><tr><th>Medicine</th><th>Potency</th><th>Qty/Unit</th><th>Dosage</th><th>Days</th></tr></thead><tbody>${rxRows}</tbody></table>` : `<p>${v.prescription ?? ""}</p>`}
      </div>
      ${v.prescriptionInstructions ? `<div style="border:1px solid #333;padding:8px;margin-top:12px"><b>Instructions:</b> ${v.prescriptionInstructions}</div>` : ""}
      ${v.followUpDate ? `<p style="margin-top:8px"><b>Follow-up:</b> ${new Date(Number(v.followUpDate) / 1000000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>` : ""}
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

  const handleExportVisitsCSV = () => {
    const rows: string[][] = [
      [
        "Date",
        "Patient",
        "Visit Type",
        "Chief Complaints",
        "Diagnosis",
        "BP",
        "Weight",
        "Follow-up",
      ],
    ];
    for (const v of filtered) {
      const p = patientMap.get(v.patientId.toString());
      rows.push([
        new Date(Number(v.visitDate) / 1000000).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        p?.name ?? "Unknown",
        v.visitType ?? "New",
        v.chiefComplaints ?? "",
        v.diagnosis ?? "",
        v.bp ?? "",
        v.weight ?? "",
        v.followUpDate
          ? new Date(Number(v.followUpDate) / 1000000).toLocaleDateString(
              "en-IN",
              { day: "2-digit", month: "short", year: "numeric" },
            )
          : "",
      ]);
    }
    downloadCSV("visits.csv", rows);
  };

  const visitTypeBadge = (type?: string) => {
    if (type === "Emergency")
      return (
        <Badge className="bg-red-100 text-red-800 text-xs">Emergency</Badge>
      );
    if (type === "Follow-up")
      return (
        <Badge className="bg-green-100 text-green-800 text-xs">Follow-up</Badge>
      );
    return <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>;
  };

  const updateRxRow = (idx: number, patch: Partial<PrescriptionItem>) =>
    setForm((f) => ({
      ...f,
      prescriptionItems: f.prescriptionItems.map((r, i) =>
        i === idx ? { ...r, ...patch } : r,
      ),
    }));

  return (
    <div className="p-6 space-y-5">
      {/* Printable Rx Portal */}
      {printVisit &&
        createPortal(
          <div className="print-root">
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <div className="text-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold">
                  {settings?.clinicName || "Homeopathy Clinic"}
                </h2>
                <p className="text-sm">
                  {settings?.doctorName}{" "}
                  {settings?.qualification ? `(${settings.qualification})` : ""}
                </p>
                <p className="text-sm">{settings?.address}</p>
                <p className="text-sm">{settings?.phone}</p>
              </div>
              {(() => {
                const patient = patientMap.get(printVisit.patientId.toString());
                return (
                  <>
                    <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <strong>Patient:</strong> {patient?.name ?? "Unknown"} (
                        {patient?.patientCode})
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {formatDate(printVisit.visitDate)}
                      </p>
                      <p>
                        <strong>Age/Gender:</strong> {Number(patient?.age ?? 0)}{" "}
                        yrs / {patient?.gender}
                      </p>
                      <p>
                        <strong>Visit Type:</strong>{" "}
                        {printVisit.visitType ?? "New"}
                      </p>
                      {printVisit.bp && (
                        <p>
                          <strong>BP:</strong> {printVisit.bp} mmHg
                        </p>
                      )}
                      {printVisit.weight && (
                        <p>
                          <strong>Weight:</strong> {printVisit.weight}
                        </p>
                      )}
                      {printVisit.temperature && (
                        <p>
                          <strong>Temp:</strong> {printVisit.temperature}°F
                        </p>
                      )}
                    </div>
                    <p className="mb-2">
                      <strong>Chief Complaints:</strong>{" "}
                      {printVisit.chiefComplaints}
                    </p>
                    {printVisit.diagnosis && (
                      <p className="mb-3">
                        <strong>Diagnosis:</strong> {printVisit.diagnosis}
                      </p>
                    )}
                    <div className="border-t pt-4 mb-4">
                      <p className="text-lg font-bold mb-2">
                        &#8478; Prescription
                      </p>
                      {printVisit.prescriptionItems?.length ? (
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1">Medicine</th>
                              <th className="text-center py-1">Potency</th>
                              <th className="text-center py-1">Qty/Unit</th>
                              <th className="text-center py-1">Dosage</th>
                              <th className="text-center py-1">Days</th>
                            </tr>
                          </thead>
                          <tbody>
                            {printVisit.prescriptionItems.map((rx, idx) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: stable for print
                              <tr key={idx} className="border-b">
                                <td className="py-1">{rx.medicineName}</td>
                                <td className="text-center py-1">
                                  {rx.potency}
                                </td>
                                <td className="text-center py-1">
                                  {rx.quantity} {rx.unit}
                                </td>
                                <td className="text-center py-1">
                                  {rx.dosage}
                                </td>
                                <td className="text-center py-1">
                                  {rx.durationDays}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm">
                          {printVisit.prescription}
                        </pre>
                      )}
                    </div>
                    {printVisit.prescriptionInstructions && (
                      <div className="border border-dashed rounded p-3 mt-2">
                        <p className="text-sm">
                          <strong>General Instructions:</strong>{" "}
                          {printVisit.prescriptionInstructions}
                        </p>
                      </div>
                    )}
                    {printVisit.followUpDate && (
                      <p className="mt-4">
                        <strong>Follow-up:</strong>{" "}
                        {formatDate(printVisit.followUpDate)}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>,
          document.body,
        )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            Visits &amp; Prescriptions
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered.length} visits recorded
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportVisitsCSV}
            className="gap-2"
            data-ocid="visits.export_button"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </Button>
          <Button
            onClick={openAdd}
            className="bg-primary text-primary-foreground gap-2"
            data-ocid="visits.add_button"
          >
            <Plus className="w-4 h-4" /> New Visit
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-xs">
        <Select
          value={filterPatient}
          onValueChange={(v) => {
            setFilterPatient(v);
            setPage(1);
          }}
        >
          <SelectTrigger data-ocid="visits.patient_filter.select">
            <SelectValue placeholder="All Patients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            {(patients ?? []).map((p) => (
              <SelectItem key={p.id.toString()} value={p.id.toString()}>
                {p.name} ({p.patientCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                    Patient
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Symptoms
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    BP
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Weight
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Follow-up
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
                      colSpan={8}
                      className="text-center py-12 text-muted-foreground"
                      data-ocid="visits.empty_state"
                    >
                      No visits recorded
                    </td>
                  </tr>
                ) : (
                  paginated.map((v, i) => {
                    const patient = patientMap.get(v.patientId.toString());
                    const isOverdue =
                      v.followUpDate !== null &&
                      Number(v.followUpDate) / 1_000_000 < Date.now();
                    return (
                      <tr
                        key={v.id.toString()}
                        className="hover:bg-muted/20"
                        data-ocid={`visits.item.${i + 1}`}
                      >
                        <td className="px-4 py-3">
                          <p>{formatDate(v.visitDate)}</p>
                          {v.visitTime && (
                            <p className="text-xs text-muted-foreground">
                              {v.visitTime}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {patient?.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {patient?.patientCode}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {visitTypeBadge(v.visitType)}
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="truncate text-xs text-muted-foreground">
                            {v.chiefComplaints || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs">{v.bp || "—"}</td>
                        <td className="px-4 py-3 text-xs">{v.weight || "—"}</td>
                        <td className="px-4 py-3">
                          {v.followUpDate ? (
                            <Badge
                              className={
                                isOverdue
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }
                            >
                              {formatDate(v.followUpDate)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handlePrint(v)}
                              title="Print Rx"
                              data-ocid={`visits.print.button.${i + 1}`}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-purple-600"
                              onClick={() => handlePdfDownload(v)}
                              title="Download PDF"
                              data-ocid={`visits.pdf_button.${i + 1}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(v)}
                              data-ocid={`visits.edit_button.${i + 1}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(v.id)}
                              data-ocid={`visits.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                              onClick={() => openRevisit(v)}
                              title="Revisit"
                              data-ocid={`visits.revisit_button.${i + 1}`}
                            >
                              <RefreshCw className="w-4 h-4" />
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
                  data-ocid="visits.pagination_prev"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  data-ocid="visits.pagination_next"
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
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="visits.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editVisit ? "Edit Visit" : "New Visit"}
            </DialogTitle>
          </DialogHeader>

          {/* Previous Visit History for Revisit */}
          {revisitPatientId &&
            (() => {
              const patientVisits = (visits ?? [])
                .filter((v) => v.patientId === revisitPatientId && v.isActive)
                .sort((a, b) => Number(b.visitDate) - Number(a.visitDate));
              const lastVisit = patientVisits[0];
              if (!lastVisit) return null;
              return (
                <Collapsible
                  open={historyOpen}
                  onOpenChange={setHistoryOpen}
                  className="mb-4"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between text-sm gap-2"
                      data-ocid="visits.revisit.history.toggle"
                    >
                      <span className="flex items-center gap-2">
                        <History className="w-4 h-4" /> Previous Visit History (
                        {patientVisits.length} visits)
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {historyOpen ? "Hide" : "Show"}
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-2 border rounded-lg p-3 bg-muted/20 max-h-64 overflow-y-auto">
                      {patientVisits.map((pv, idx) => (
                        <div
                          key={pv.id.toString()}
                          className={`p-2 rounded ${idx === 0 ? "bg-primary/5 border border-primary/20" : "bg-background border"}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">
                              {formatDate(pv.visitDate)}
                            </span>
                            {pv.visitType && (
                              <Badge
                                className={
                                  pv.visitType === "New"
                                    ? "bg-blue-100 text-blue-800 text-xs"
                                    : "bg-green-100 text-green-800 text-xs"
                                }
                              >
                                {pv.visitType}
                              </Badge>
                            )}
                            {idx === 0 && (
                              <Badge className="bg-amber-100 text-amber-800 text-xs">
                                Last Visit
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs">
                            <span className="font-medium">Complaints:</span>{" "}
                            {pv.chiefComplaints}
                          </p>
                          {pv.diagnosis && (
                            <p className="text-xs">
                              <span className="font-medium">Diagnosis:</span>{" "}
                              {pv.diagnosis}
                            </p>
                          )}
                          {pv.prescriptionItems &&
                            pv.prescriptionItems.length > 0 && (
                              <p className="text-xs">
                                <span className="font-medium">Medicines:</span>{" "}
                                {pv.prescriptionItems
                                  .map(
                                    (rx) => `${rx.medicineName} ${rx.potency}`,
                                  )
                                  .join(", ")}
                              </p>
                            )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })()}
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details" data-ocid="visits.tab.details">
                Visit Details
              </TabsTrigger>
              <TabsTrigger
                value="prescription"
                data-ocid="visits.tab.prescription"
              >
                Prescription (℞)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid grid-cols-2 gap-4">
                {/* Patient */}
                <div className="col-span-2 space-y-1.5">
                  <Label>Patient *</Label>
                  {editVisit || revisitPatientId ? (
                    <Input
                      value={
                        patientMap.get(form.patientId)?.name ?? form.patientId
                      }
                      disabled
                    />
                  ) : (
                    <>
                      <Input
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        placeholder="Type patient name or code..."
                        data-ocid="visits.patient_search.input"
                      />
                      {patientSearch && filteredPatients.length > 0 && (
                        <div className="border rounded-lg max-h-40 overflow-y-auto">
                          {filteredPatients.slice(0, 8).map((p) => (
                            <button
                              key={p.id.toString()}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                              onClick={() => {
                                setForm((f) => ({
                                  ...f,
                                  patientId: p.id.toString(),
                                }));
                                setPatientSearch(
                                  `${p.name} (${p.patientCode})`,
                                );
                              }}
                            >
                              {p.name}{" "}
                              <span className="text-muted-foreground">
                                ({p.patientCode})
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {form.patientId && (
                        <p className="text-xs text-green-600">
                          ✓ Selected: {patientMap.get(form.patientId)?.name}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Visit Type */}
                <div className="space-y-1.5">
                  <Label>Visit Type *</Label>
                  <Select
                    value={form.visitType}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        visitType: v as "New" | "Follow-up" | "Emergency",
                      }))
                    }
                  >
                    <SelectTrigger data-ocid="visits.type.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date + Time */}
                <div className="space-y-1.5">
                  <Label>Visit Date *</Label>
                  <Input
                    type="date"
                    value={form.visitDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, visitDate: e.target.value }))
                    }
                    data-ocid="visits.date.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Visit Time</Label>
                  <Input
                    type="time"
                    value={form.visitTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, visitTime: e.target.value }))
                    }
                    data-ocid="visits.time.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Follow-up Date</Label>
                  <Input
                    type="date"
                    value={form.followUpDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, followUpDate: e.target.value }))
                    }
                    data-ocid="visits.followup.input"
                  />
                </div>

                {/* Vitals */}
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Vitals
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Weight (kg)</Label>
                  <Input
                    value={form.weight}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, weight: e.target.value }))
                    }
                    placeholder="68 kg"
                    data-ocid="visits.weight.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>BP (mmHg)</Label>
                  <Input
                    value={form.bp}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bp: e.target.value }))
                    }
                    placeholder="120/80"
                    data-ocid="visits.bp.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Temperature (°F)</Label>
                  <Input
                    value={form.temperature}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, temperature: e.target.value }))
                    }
                    placeholder="98.6"
                    data-ocid="visits.temp.input"
                  />
                </div>

                {/* Complaints + Diagnosis */}
                <div className="col-span-2 space-y-1.5">
                  <Label>Chief Complaints / Symptoms *</Label>
                  <Textarea
                    value={form.chiefComplaints}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        chiefComplaints: e.target.value,
                      }))
                    }
                    rows={3}
                    data-ocid="visits.complaints.textarea"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Examination Findings</Label>
                  <Input
                    value={form.examination}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, examination: e.target.value }))
                    }
                    placeholder="BP, pulse, physical findings"
                    data-ocid="visits.examination.input"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Diagnosis / Observation</Label>
                  <Textarea
                    value={form.diagnosis}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, diagnosis: e.target.value }))
                    }
                    rows={2}
                    data-ocid="visits.diagnosis.textarea"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>General Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    rows={2}
                    data-ocid="visits.notes.textarea"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prescription">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>General Instructions</Label>
                  <Input
                    value={form.prescriptionInstructions}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        prescriptionInstructions: e.target.value,
                      }))
                    }
                    placeholder="e.g. Avoid coffee, take medicines before meals"
                    data-ocid="visits.rx_instructions.input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Medicine Rows</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          prescriptionItems: [
                            ...f.prescriptionItems,
                            EMPTY_RX_ROW(),
                          ],
                        }))
                      }
                      data-ocid="visits.rx_add.button"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {form.prescriptionItems.map((rx, idx) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: controlled form list, idx stable
                        key={`rx-row-${idx}`}
                        className="rounded-lg border p-3 space-y-2 bg-muted/20"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Medicine Name</Label>
                            <Input
                              value={rx.medicineName}
                              onChange={(e) =>
                                updateRxRow(idx, {
                                  medicineName: e.target.value,
                                })
                              }
                              placeholder="Arnica Montana"
                              list={`med-list-${idx}`}
                              className="h-8 text-sm"
                            />
                            <datalist id={`med-list-${idx}`}>
                              {(medicines ?? []).map((m) => (
                                <option
                                  key={m.id.toString()}
                                  value={`${m.name} ${m.potency}`}
                                />
                              ))}
                            </datalist>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Potency</Label>
                            <Input
                              value={rx.potency}
                              onChange={(e) =>
                                updateRxRow(idx, { potency: e.target.value })
                              }
                              placeholder="30C, 200C, 1M, Q"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              value={rx.quantity}
                              onChange={(e) =>
                                updateRxRow(idx, { quantity: e.target.value })
                              }
                              placeholder="3"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit</Label>
                            <Select
                              value={rx.unit}
                              onValueChange={(v) =>
                                updateRxRow(idx, { unit: v })
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "globules",
                                  "ml",
                                  "drops",
                                  "grams",
                                  "tablets",
                                ].map((u) => (
                                  <SelectItem key={u} value={u}>
                                    {u}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Dosage</Label>
                            <Input
                              value={rx.dosage}
                              onChange={(e) =>
                                updateRxRow(idx, { dosage: e.target.value })
                              }
                              placeholder="TDS, BD, OD"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Duration (days)</Label>
                            <Input
                              type="number"
                              min="1"
                              value={rx.durationDays}
                              onChange={(e) =>
                                updateRxRow(idx, {
                                  durationDays: Number(e.target.value),
                                })
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Notes</Label>
                            <Input
                              value={rx.notes ?? ""}
                              onChange={(e) =>
                                updateRxRow(idx, { notes: e.target.value })
                              }
                              placeholder="Special instructions"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        {form.prescriptionItems.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive h-7 text-xs"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                prescriptionItems: f.prescriptionItems.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }
                          >
                            <X className="w-3 h-3 mr-1" /> Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legacy text prescription */}
                <div className="space-y-1.5">
                  <Label>Additional Prescription Notes</Label>
                  <Textarea
                    value={form.prescription}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, prescription: e.target.value }))
                    }
                    placeholder="Free-form prescription text"
                    rows={3}
                    className="font-mono text-sm"
                    data-ocid="visits.prescription.textarea"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="visits.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground"
              data-ocid="visits.submit_button"
            >
              {editVisit ? "Update Visit" : "Save Visit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="visits.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this visit record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="visits.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="visits.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
