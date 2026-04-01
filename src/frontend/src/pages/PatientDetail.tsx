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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Printer,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  PaymentStatus,
  type Visit,
  useAddVisit,
  useBillsByPatient,
  useClinicSettings,
  useDeleteVisit,
  usePatient,
  useUpdateVisit,
  useVisitsByPatient,
} from "../hooks/useQueries";
import {
  formatDate,
  formatRupees,
  nowNanoseconds,
  toDateInputValue,
  toNanoseconds,
} from "../utils/formatters";

const EMPTY_VISIT = {
  visitType: "New" as "New" | "Follow-up" | "Emergency",
  chiefComplaints: "",
  examination: "",
  diagnosis: "",
  prescription: "",
  medicinePrescribed: "",
  notes: "",
  visitDate: new Date().toISOString().split("T")[0],
  followUpDate: "",
};

export default function PatientDetail() {
  const { patientId } = useParams({ from: "/layout/patients/$patientId" });
  const navigate = useNavigate();
  const patientIdBig = BigInt(patientId);

  const { data: patient, isLoading: patientLoading } = usePatient(patientIdBig);
  const { data: visits } = useVisitsByPatient(patientIdBig);
  const { data: bills } = useBillsByPatient(patientIdBig);
  const { data: settings } = useClinicSettings();

  const addVisit = useAddVisit();
  const updateVisit = useUpdateVisit();
  const deleteVisit = useDeleteVisit();

  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [isRevisit, setIsRevisit] = useState(false);
  const [editVisit, setEditVisit] = useState<Visit | null>(null);
  const [deleteVisitId, setDeleteVisitId] = useState<bigint | null>(null);
  const [printVisit, setPrintVisit] = useState<Visit | null>(null);
  const [vForm, setVForm] = useState(EMPTY_VISIT);
  const printRef = useRef<HTMLDivElement>(null);

  const openRevisit = (_v: Visit) => {
    setEditVisit(null);
    setIsRevisit(true);
    setVForm({
      visitDate: new Date().toISOString().split("T")[0],
      visitType: "Follow-up",
      followUpDate: "",
      chiefComplaints: "",
      examination: "",
      diagnosis: "",
      prescription: "",
      medicinePrescribed: "",
      notes: "",
    });
    setVisitModalOpen(true);
  };

  const openAddVisit = () => {
    setIsRevisit(false);
    setEditVisit(null);
    setVForm(EMPTY_VISIT);
    setVisitModalOpen(true);
  };

  const openEditVisit = (v: Visit) => {
    setEditVisit(v);
    setVForm({
      visitType: v.visitType ?? "New",
      chiefComplaints: v.chiefComplaints,
      examination: v.examination,
      diagnosis: v.diagnosis,
      prescription: v.prescription,
      medicinePrescribed: v.medicinePrescribed,
      notes: v.notes,
      visitDate: toDateInputValue(v.visitDate),
      followUpDate: toDateInputValue(v.followUpDate),
    });
    setVisitModalOpen(true);
  };

  const handleVisitSubmit = async () => {
    if (!vForm.chiefComplaints) {
      toast.error("Chief complaints required");
      return;
    }
    try {
      const visitData = {
        patientId: patientIdBig,
        visitType:
          ((vForm as { visitType?: string }).visitType as
            | "New"
            | "Follow-up"
            | "Emergency"
            | undefined) ?? "New",
        chiefComplaints: vForm.chiefComplaints,
        examination: vForm.examination,
        diagnosis: vForm.diagnosis,
        prescription: vForm.prescription,
        medicinePrescribed: vForm.medicinePrescribed,
        notes: vForm.notes,
        visitDate: vForm.visitDate
          ? toNanoseconds(vForm.visitDate)
          : nowNanoseconds(),
        followUpDate: vForm.followUpDate
          ? toNanoseconds(vForm.followUpDate)
          : null,
      };
      if (editVisit) {
        await updateVisit.mutateAsync({ id: editVisit.id, visit: visitData });
        toast.success("Visit updated");
      } else {
        await addVisit.mutateAsync(visitData);
        toast.success("Visit added");
      }
      setVisitModalOpen(false);
    } catch {
      toast.error("Failed to save visit");
    }
  };

  const handlePrint = (v: Visit) => {
    setPrintVisit(v);
    setTimeout(() => window.print(), 200);
  };

  if (patientLoading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!patient) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/patients" })}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Print Rx */}
      {printVisit && (
        <div className="hidden print-only" ref={printRef}>
          <div className="print-container">
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
            <div className="mb-4">
              <p>
                <strong>Patient:</strong> {patient.name} ({patient.patientCode})
              </p>
              <p>
                <strong>Age/Gender:</strong> {Number(patient.age)} yrs /{" "}
                {patient.gender}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(printVisit.visitDate)}
              </p>
            </div>
            <div className="mb-3">
              <p>
                <strong>Chief Complaints:</strong> {printVisit.chiefComplaints}
              </p>
              {printVisit.diagnosis && (
                <p>
                  <strong>Diagnosis:</strong> {printVisit.diagnosis}
                </p>
              )}
            </div>
            <div className="border-t pt-4">
              <p className="text-lg font-bold mb-2">&#8478; Prescription</p>
              <pre className="whitespace-pre-wrap text-sm">
                {printVisit.prescription}
              </pre>
            </div>
            {printVisit.followUpDate && (
              <p className="mt-4">
                <strong>Follow-up:</strong>{" "}
                {formatDate(printVisit.followUpDate)}
              </p>
            )}
            {printVisit.notes && (
              <p className="mt-2">
                <strong>Notes:</strong> {printVisit.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/patients" })}
          data-ocid="patient_detail.back_button"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">{patient.name}</h1>
          <p className="text-muted-foreground text-sm">
            {patient.patientCode} · {Number(patient.age)} yrs · {patient.gender}
          </p>
        </div>
        <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
          Active
        </Badge>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Contact
            </p>
            <p className="text-sm font-medium">{patient.phone}</p>
            <p className="text-sm text-muted-foreground">
              {patient.address}
              {patient.state ? `, ${patient.state}` : ""}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Chief Complaints
            </p>
            <p className="text-sm">{patient.chiefComplaints || "—"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Medical History
            </p>
            <p className="text-sm">{patient.medicalHistory || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visits">
        <TabsList>
          <TabsTrigger value="visits" data-ocid="patient_detail.visits.tab">
            Visits ({visits?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="timeline" data-ocid="patient_detail.timeline.tab">
            History Timeline
          </TabsTrigger>
          <TabsTrigger value="bills" data-ocid="patient_detail.bills.tab">
            Bills ({bills?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button
              onClick={openAddVisit}
              size="sm"
              className="bg-primary text-primary-foreground gap-2"
              data-ocid="patient_detail.add_visit.button"
            >
              Add Visit
            </Button>
          </div>
          {(visits?.length ?? 0) === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="patient_detail.visits.empty_state"
            >
              No visits recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {[...(visits ?? [])].reverse().map((v, i) => (
                <Card
                  key={v.id.toString()}
                  className="shadow-card"
                  data-ocid={`patient_detail.visits.item.${i + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">
                            {formatDate(v.visitDate)}
                          </p>
                          {v.followUpDate && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Calendar className="w-3 h-3" /> Follow-up:{" "}
                              {formatDate(v.followUpDate)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">Complaint:</span>{" "}
                          {v.chiefComplaints}
                        </p>
                        {v.diagnosis && (
                          <p className="text-sm">
                            <span className="font-medium">Diagnosis:</span>{" "}
                            {v.diagnosis}
                          </p>
                        )}
                        {v.prescription && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              &#8478; Prescription
                            </p>
                            <pre className="text-xs whitespace-pre-wrap">
                              {v.prescription}
                            </pre>
                          </div>
                        )}
                        {v.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Notes: {v.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-3 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handlePrint(v)}
                          data-ocid={`patient_detail.print.button.${i + 1}`}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditVisit(v)}
                          data-ocid={`patient_detail.visits.edit_button.${i + 1}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteVisitId(v.id)}
                          data-ocid={`patient_detail.visits.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700"
                          onClick={() => openRevisit(v)}
                          title="Revisit"
                          data-ocid={`patient_detail.revisit_button.${i + 1}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="relative">
            {(visits?.length ?? 0) === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-ocid="patient_detail.timeline.empty_state"
              >
                No visits recorded yet.
              </div>
            ) : (
              <div className="space-y-0 relative before:absolute before:left-5 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
                {[...(visits ?? [])]
                  .sort((a, b) => Number(b.visitDate) - Number(a.visitDate))
                  .map((v, i) => (
                    <div
                      key={v.id.toString()}
                      className="relative flex gap-4 pb-6"
                      data-ocid={`patient_detail.timeline.item.${i + 1}`}
                    >
                      <div className="relative z-10 flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            v.visitType === "New"
                              ? "bg-blue-100 border-blue-400"
                              : v.visitType === "Emergency"
                                ? "bg-red-100 border-red-400"
                                : "bg-green-100 border-green-400"
                          }`}
                        >
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">
                            {formatDate(v.visitDate)}
                          </span>
                          {v.visitTime && (
                            <span className="text-xs text-muted-foreground">
                              {v.visitTime}
                            </span>
                          )}
                          {v.visitType && (
                            <Badge
                              className={
                                v.visitType === "New"
                                  ? "bg-blue-100 text-blue-800 text-xs"
                                  : v.visitType === "Emergency"
                                    ? "bg-red-100 text-red-800 text-xs"
                                    : "bg-green-100 text-green-800 text-xs"
                              }
                            >
                              {v.visitType}
                            </Badge>
                          )}
                          {i === 0 && (
                            <Badge className="bg-primary/10 text-primary text-xs">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <Card className="shadow-sm">
                          <CardContent className="p-3 space-y-1.5">
                            <p className="text-sm">
                              <span className="font-medium text-muted-foreground">
                                Complaints:
                              </span>{" "}
                              {v.chiefComplaints}
                            </p>
                            {v.diagnosis && (
                              <p className="text-sm">
                                <span className="font-medium text-muted-foreground">
                                  Diagnosis:
                                </span>{" "}
                                {v.diagnosis}
                              </p>
                            )}
                            {v.bp && (
                              <p className="text-xs text-muted-foreground">
                                BP: {v.bp} | Weight: {v.weight || "—"}
                              </p>
                            )}
                            {v.prescriptionItems &&
                              v.prescriptionItems.length > 0 && (
                                <div className="mt-1 pt-1 border-t">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    ℞ Medicines:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {v.prescriptionItems.map((rx, idx) => (
                                      <Badge
                                        key={`${rx.medicineName}-${idx}`}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {rx.medicineName} {rx.potency} —{" "}
                                        {rx.dosage}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            {v.followUpDate && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Next:{" "}
                                {formatDate(v.followUpDate)}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bills" className="mt-4">
          {(bills?.length ?? 0) === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="patient_detail.bills.empty_state"
            >
              No bills yet.
            </div>
          ) : (
            <div className="space-y-3">
              {bills?.map((b, i) => (
                <Card
                  key={b.id.toString()}
                  className="shadow-card"
                  data-ocid={`patient_detail.bills.item.${i + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{b.billNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(b.billDate)}
                        </p>
                        {b.items?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {b.items.map((it) => it.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatRupees(b.totalAmount)}
                        </p>
                        <Badge
                          className={
                            b.paymentStatus === PaymentStatus.paid
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-orange-100 text-orange-800 border-orange-200"
                          }
                        >
                          {b.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Visit Modal */}
      <Dialog open={visitModalOpen} onOpenChange={setVisitModalOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="patient_detail.visit.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editVisit
                ? "Edit Visit"
                : isRevisit
                  ? "New Revisit"
                  : "Add Visit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Visit Date</Label>
                <Input
                  type="date"
                  value={vForm.visitDate}
                  onChange={(e) =>
                    setVForm((f) => ({ ...f, visitDate: e.target.value }))
                  }
                  data-ocid="patient_detail.visit.date.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={vForm.followUpDate}
                  onChange={(e) =>
                    setVForm((f) => ({ ...f, followUpDate: e.target.value }))
                  }
                  data-ocid="patient_detail.visit.followup.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Visit Type</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={(vForm as { visitType?: string }).visitType ?? "New"}
                  onChange={(e) =>
                    setVForm((f) => ({
                      ...f,
                      visitType: e.target.value as
                        | "New"
                        | "Follow-up"
                        | "Emergency",
                    }))
                  }
                  data-ocid="patient_detail.visit.type.select"
                >
                  <option value="New">New</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Chief Complaints *</Label>
                <Textarea
                  value={vForm.chiefComplaints}
                  onChange={(e) =>
                    setVForm((f) => ({ ...f, chiefComplaints: e.target.value }))
                  }
                  placeholder="Main symptoms"
                  rows={2}
                  data-ocid="patient_detail.visit.complaint.input"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Examination</Label>
                <Input
                  value={vForm.examination}
                  onChange={(e) =>
                    setVForm((f) => ({ ...f, examination: e.target.value }))
                  }
                  placeholder="BP, pulse, findings"
                  data-ocid="patient_detail.visit.examination.input"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Diagnosis</Label>
                <Input
                  value={vForm.diagnosis}
                  onChange={(e) =>
                    setVForm((f) => ({ ...f, diagnosis: e.target.value }))
                  }
                  placeholder="Clinical diagnosis"
                  data-ocid="patient_detail.visit.diagnosis.input"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Prescription (℞)</Label>
                <Textarea
                  value={vForm.prescription}
                  onChange={(e) =>
                    setVForm((f) => ({ ...f, prescription: e.target.value }))
                  }
                  placeholder="e.g. Arnica 30C - 3 pills - TDS - 7 days"
                  rows={4}
                  className="font-mono text-sm"
                  data-ocid="patient_detail.visit.prescription.textarea"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={vForm.notes}
                  onChange={(e) =>
                    setVForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Additional notes"
                  rows={2}
                  data-ocid="patient_detail.visit.notes.textarea"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVisitModalOpen(false)}
              data-ocid="patient_detail.visit.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVisitSubmit}
              className="bg-primary text-primary-foreground"
              data-ocid="patient_detail.visit.submit_button"
            >
              {editVisit ? "Update" : "Save Visit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteVisitId}
        onOpenChange={(o) => !o && setDeleteVisitId(null)}
      >
        <AlertDialogContent data-ocid="patient_detail.delete_visit.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this visit record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="patient_detail.delete_visit.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteVisit.mutateAsync(deleteVisitId!);
                  toast.success("Visit deleted");
                } catch {
                  toast.error("Failed to delete");
                } finally {
                  setDeleteVisitId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
              data-ocid="patient_detail.delete_visit.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
