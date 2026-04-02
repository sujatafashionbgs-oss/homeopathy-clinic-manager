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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Edit, MessageCircle, Plus, Send, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Patient,
  useAllBills,
  useAllVisits,
  useClinicSettings,
  useSearchPatients,
  useWhatsAppStore,
} from "../hooks/useQueries";
import { formatDate } from "../utils/formatters";

const VARIABLES = [
  "{patient_name}",
  "{clinic_name}",
  "{doctor_name}",
  "{clinic_phone}",
  "{amount_due}",
  "{followup_date}",
  "{medicines_list}",
  "{visit_date}",
];

const CATEGORIES = [
  "Due Payment Reminder",
  "Follow-up Reminder",
  "Prescription Send",
  "General",
];

function resolveTemplate(
  body: string,
  patient: Patient | undefined,
  settings:
    | { clinicName?: string; doctorName?: string; phone?: string }
    | undefined,
  amountDue?: number,
  followupDate?: string,
  medicinesList?: string,
) {
  if (!patient) return body;
  return body
    .replace(/\{patient_name\}/g, patient.name)
    .replace(/\{clinic_name\}/g, settings?.clinicName ?? "Our Clinic")
    .replace(/\{doctor_name\}/g, settings?.doctorName ?? "Doctor")
    .replace(/\{clinic_phone\}/g, settings?.phone ?? "")
    .replace(/\{amount_due\}/g, amountDue ? `₹${amountDue.toFixed(2)}` : "₹0")
    .replace(/\{followup_date\}/g, followupDate ?? "your scheduled date")
    .replace(
      /\{medicines_list\}/g,
      medicinesList ?? "your prescribed medicines",
    )
    .replace(
      /\{visit_date\}/g,
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    );
}

export default function WhatsApp() {
  const { data: patients } = useSearchPatients("");
  const { data: visits } = useAllVisits();
  const { data: bills } = useAllBills();
  const { data: settings } = useClinicSettings();
  const store = useWhatsAppStore();

  // Templates tab state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<{
    id: string;
    name: string;
    category: string;
    body: string;
  } | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [tForm, setTForm] = useState({
    name: "",
    category: "Due Payment Reminder",
    body: "",
  });

  // Send tab state
  const [sendPatientSearch, setSendPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [composedMessage, setComposedMessage] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Bulk send state
  const [bulkTab, setBulkTab] = useState("dues");
  const [selectedBulk, setSelectedBulk] = useState<Set<string>>(new Set());
  const [bulkTemplateId, setBulkTemplateId] = useState("");
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const patientMap = new Map((patients ?? []).map((p) => [p.id.toString(), p]));

  const filteredSendPatients = sendPatientSearch
    ? (patients ?? []).filter(
        (p) =>
          p.name.toLowerCase().includes(sendPatientSearch.toLowerCase()) ||
          p.patientCode
            .toLowerCase()
            .includes(sendPatientSearch.toLowerCase()) ||
          p.phone.includes(sendPatientSearch),
      )
    : [];

  // Pending dues patients
  const pendingDuePatients = (patients ?? []).filter((p) => {
    const due = (bills ?? [])
      .filter((b) => b.patientId === p.id && b.paymentStatus !== "paid")
      .reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);
    return due > 0;
  });

  // Follow-up due today patients
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const followupPatients = (patients ?? []).filter((p) => {
    return (visits ?? []).some((v) => {
      if (v.patientId !== p.id || !v.followUpDate) return false;
      const d = new Date(Number(v.followUpDate) / 1_000_000);
      return d >= today && d <= todayEnd;
    });
  });

  const openAddTemplate = () => {
    setEditTemplate(null);
    setTForm({ name: "", category: "Due Payment Reminder", body: "" });
    setTemplateModalOpen(true);
  };

  const openEditTemplate = (t: typeof editTemplate) => {
    if (!t) return;
    setEditTemplate(t);
    setTForm({ name: t.name, category: t.category, body: t.body });
    setTemplateModalOpen(true);
  };

  const saveTemplate = () => {
    if (!tForm.name || !tForm.body) {
      toast.error("Name and message body are required");
      return;
    }
    if (editTemplate) {
      store.updateTemplate(editTemplate.id, tForm);
      toast.success("Template updated");
    } else {
      store.addTemplate(tForm);
      toast.success("Template added");
    }
    setTemplateModalOpen(false);
  };

  const insertVariable = (v: string) => {
    setTForm((f) => ({ ...f, body: f.body + v }));
  };

  const handlePatientSelect = (p: Patient) => {
    setSelectedPatientId(p.id.toString());
    setSendPatientSearch(`${p.name} (${p.patientCode})`);
    setShowPatientDropdown(false);
    // Auto-compose if template selected
    if (selectedTemplateId) {
      const tmpl = store.templates.find((t) => t.id === selectedTemplateId);
      if (tmpl) composeMessage(tmpl, p);
    }
  };

  const composeMessage = (
    tmpl: { body: string; category: string },
    patient: Patient,
  ) => {
    const due = (bills ?? [])
      .filter((b) => b.patientId === patient.id && b.paymentStatus !== "paid")
      .reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);

    const lastVisit = (visits ?? [])
      .filter((v) => v.patientId === patient.id)
      .sort((a, b) => Number(b.visitDate) - Number(a.visitDate))[0];

    const followupDate = lastVisit?.followUpDate
      ? formatDate(lastVisit.followUpDate)
      : undefined;

    const medicinesList = lastVisit?.prescriptionItems
      ?.map((rx) => `${rx.medicineName} ${rx.potency}`)
      .join(", ");

    const resolved = resolveTemplate(
      tmpl.body,
      patient,
      settings,
      due,
      followupDate,
      medicinesList,
    );
    setComposedMessage(resolved);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = store.templates.find((t) => t.id === templateId);
    const patient = patientMap.get(selectedPatientId);
    if (tmpl && patient) composeMessage(tmpl, patient);
  };

  const handleSendWhatsApp = () => {
    const patient = patientMap.get(selectedPatientId);
    if (!patient) {
      toast.error("Please select a patient");
      return;
    }
    if (!composedMessage) {
      toast.error("Message cannot be empty");
      return;
    }
    const url = `https://wa.me/91${patient.phone}?text=${encodeURIComponent(composedMessage)}`;
    window.open(url, "_blank");
    const tmpl = store.templates.find((t) => t.id === selectedTemplateId);
    store.addLog({
      patientId: patient.id,
      templateName: tmpl?.name ?? "Custom",
      message: composedMessage,
      sentAt: BigInt(Date.now()) * 1_000_000n,
    });
    toast.success("WhatsApp opened");
  };

  const toggleBulkPatient = (id: string) => {
    setSelectedBulk((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkSend = () => {
    const tmpl = store.templates.find((t) => t.id === bulkTemplateId);
    if (!tmpl) {
      toast.error("Select a template");
      return;
    }
    if (selectedBulk.size === 0) {
      toast.error("Select at least one patient");
      return;
    }
    setBulkConfirmOpen(true);
  };

  const executeBulkSend = () => {
    const tmpl = store.templates.find((t) => t.id === bulkTemplateId);
    if (!tmpl) return;
    let sent = 0;
    for (const pid of selectedBulk) {
      const patient = patientMap.get(pid);
      if (!patient) continue;
      const due = (bills ?? [])
        .filter((b) => b.patientId === patient.id && b.paymentStatus !== "paid")
        .reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);
      const lastVisit = (visits ?? [])
        .filter((v) => v.patientId === patient.id)
        .sort((a, b) => Number(b.visitDate) - Number(a.visitDate))[0];
      const followupDate = lastVisit?.followUpDate
        ? formatDate(lastVisit.followUpDate)
        : undefined;
      const medicinesList = lastVisit?.prescriptionItems
        ?.map((rx) => `${rx.medicineName} ${rx.potency}`)
        .join(", ");
      const msg = resolveTemplate(
        tmpl.body,
        patient,
        settings,
        due,
        followupDate,
        medicinesList,
      );
      const url = `https://wa.me/91${patient.phone}?text=${encodeURIComponent(msg)}`;
      setTimeout(() => window.open(url, "_blank"), sent * 1500);
      store.addLog({
        patientId: patient.id,
        templateName: tmpl.name,
        message: msg,
        sentAt: BigInt(Date.now()) * 1_000_000n,
      });
      sent++;
    }
    toast.success(`Sending to ${sent} patients`);
    setBulkConfirmOpen(false);
    setSelectedBulk(new Set());
  };

  const categoryColor = (cat: string) => {
    if (cat === "Due Payment Reminder") return "bg-red-100 text-red-800";
    if (cat === "Follow-up Reminder") return "bg-blue-100 text-blue-800";
    if (cat === "Prescription Send") return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-green-600" /> WhatsApp
          Communication
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Templates, bulk messaging, and send log
        </p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="mb-4">
          <TabsTrigger value="templates" data-ocid="wa.templates.tab">
            Templates
          </TabsTrigger>
          <TabsTrigger value="send" data-ocid="wa.send.tab">
            Send Message
          </TabsTrigger>
          <TabsTrigger value="bulk" data-ocid="wa.bulk.tab">
            Bulk Send
          </TabsTrigger>
          <TabsTrigger value="log" data-ocid="wa.log.tab">
            Send Log ({store.logs.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TEMPLATES TAB ── */}
        <TabsContent value="templates">
          <div className="flex justify-end mb-4">
            <Button
              onClick={openAddTemplate}
              className="bg-primary text-primary-foreground gap-2"
              data-ocid="wa.add_template.button"
            >
              <Plus className="w-4 h-4" /> New Template
            </Button>
          </div>
          <div className="grid gap-4">
            {store.templates.map((t, i) => (
              <Card
                key={t.id}
                className="shadow-card"
                data-ocid={`wa.template.item.${i + 1}`}
              >
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <Badge className={`text-xs ${categoryColor(t.category)}`}>
                      {t.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEditTemplate(t)}
                      data-ocid={`wa.template.edit_button.${i + 1}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteTemplateId(t.id)}
                      data-ocid={`wa.template.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-muted/40 rounded-lg p-3 whitespace-pre-wrap">
                    {t.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── SEND MESSAGE TAB ── */}
        <TabsContent value="send">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Select Patient *</Label>
                <div className="relative">
                  <Input
                    value={sendPatientSearch}
                    onChange={(e) => {
                      setSendPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    placeholder="Search patient name, code, phone..."
                    data-ocid="wa.send.patient_search.input"
                  />
                  {showPatientDropdown && filteredSendPatients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 border rounded-lg bg-background shadow-md max-h-48 overflow-y-auto">
                      {filteredSendPatients.slice(0, 8).map((p) => (
                        <button
                          key={p.id.toString()}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => handlePatientSelect(p)}
                        >
                          <span className="font-medium">{p.name}</span>{" "}
                          <span className="text-muted-foreground">
                            ({p.patientCode}) · {p.phone}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Select Template</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger data-ocid="wa.send.template.select">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {store.templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Message Preview (Editable)</Label>
                <Textarea
                  value={composedMessage}
                  onChange={(e) => setComposedMessage(e.target.value)}
                  rows={6}
                  placeholder="Select a patient and template to auto-compose, or type manually..."
                  data-ocid="wa.send.message.textarea"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleSendWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  data-ocid="wa.send.open_whatsapp.button"
                >
                  <MessageCircle className="w-4 h-4" /> Open WhatsApp
                </Button>
                {(() => {
                  const tmpl = store.templates.find(
                    (t) => t.id === selectedTemplateId,
                  );
                  if (tmpl?.category === "Prescription Send") {
                    return (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => window.print()}
                        data-ocid="wa.send.print_rx.button"
                      >
                        Download Rx PDF → then attach on WhatsApp
                      </Button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Right: variable guide */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                  Available Variables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {VARIABLES.map((v) => (
                  <div
                    key={v}
                    className="flex items-center justify-between text-sm"
                  >
                    <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                      {v}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => setComposedMessage((m) => m + v)}
                    >
                      Insert
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── BULK SEND TAB ── */}
        <TabsContent value="bulk">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {(["dues", "followups"] as const).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={bulkTab === t ? "default" : "outline"}
                    className={
                      bulkTab === t ? "bg-primary text-primary-foreground" : ""
                    }
                    onClick={() => {
                      setBulkTab(t);
                      setSelectedBulk(new Set());
                    }}
                    data-ocid={`wa.bulk.${t}.tab`}
                  >
                    {t === "dues" ? "Pending Dues" : "Follow-ups Today"}
                  </Button>
                ))}
              </div>
              <Select value={bulkTemplateId} onValueChange={setBulkTemplateId}>
                <SelectTrigger
                  className="w-56"
                  data-ocid="wa.bulk.template.select"
                >
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {store.templates
                    .filter((t) =>
                      bulkTab === "dues"
                        ? t.category === "Due Payment Reminder"
                        : t.category === "Follow-up Reminder",
                    )
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  {store.templates
                    .filter((t) => t.category === "General")
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkSend}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                data-ocid="wa.bulk.send.button"
              >
                <Send className="w-4 h-4" /> Send to Selected (
                {selectedBulk.size})
              </Button>
            </div>

            {(() => {
              const list =
                bulkTab === "dues" ? pendingDuePatients : followupPatients;
              if (list.length === 0) {
                return (
                  <div
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="wa.bulk.empty_state"
                  >
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>
                      No{" "}
                      {bulkTab === "dues"
                        ? "patients with pending dues"
                        : "follow-ups today"}
                    </p>
                  </div>
                );
              }
              return (
                <Card className="shadow-card">
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-2 w-8">
                            <Checkbox
                              checked={
                                selectedBulk.size === list.length &&
                                list.length > 0
                              }
                              onCheckedChange={(v) => {
                                if (v)
                                  setSelectedBulk(
                                    new Set(list.map((p) => p.id.toString())),
                                  );
                                else setSelectedBulk(new Set());
                              }}
                              data-ocid="wa.bulk.select_all.checkbox"
                            />
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                            Patient
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                            Phone
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                            {bulkTab === "dues"
                              ? "Amount Due"
                              : "Follow-up Date"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {list.map((p, i) => {
                          const due = (bills ?? [])
                            .filter(
                              (b) =>
                                b.patientId === p.id &&
                                b.paymentStatus !== "paid",
                            )
                            .reduce(
                              (sum, b) => sum + (b.totalAmount - b.paidAmount),
                              0,
                            );
                          const lastFollowup = (visits ?? [])
                            .filter(
                              (v) => v.patientId === p.id && v.followUpDate,
                            )
                            .sort(
                              (a, b) =>
                                Number(b.visitDate) - Number(a.visitDate),
                            )[0];
                          return (
                            <tr
                              key={p.id.toString()}
                              data-ocid={`wa.bulk.patient.item.${i + 1}`}
                            >
                              <td className="px-4 py-2">
                                <Checkbox
                                  checked={selectedBulk.has(p.id.toString())}
                                  onCheckedChange={() =>
                                    toggleBulkPatient(p.id.toString())
                                  }
                                  data-ocid={`wa.bulk.patient.checkbox.${i + 1}`}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <p className="font-medium">{p.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {p.patientCode}
                                </p>
                              </td>
                              <td className="px-4 py-2 text-muted-foreground">
                                {p.phone}
                              </td>
                              <td className="px-4 py-2">
                                {bulkTab === "dues" ? (
                                  <Badge className="bg-red-100 text-red-800">
                                    ₹{due.toFixed(0)}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    {lastFollowup?.followUpDate
                                      ? formatDate(lastFollowup.followUpDate)
                                      : "—"}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </TabsContent>

        {/* ── SEND LOG TAB ── */}
        <TabsContent value="log">
          {store.logs.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="wa.log.empty_state"
            >
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No messages sent yet</p>
            </div>
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Patient
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Template
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Date/Time
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Message Preview
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...store.logs].reverse().map((log, i) => {
                      const patient = patientMap.get(log.patientId.toString());
                      return (
                        <tr key={log.id} data-ocid={`wa.log.item.${i + 1}`}>
                          <td className="px-4 py-3">
                            <p className="font-medium">
                              {patient?.name ?? "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {patient?.phone}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {log.templateName}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(
                              Number(log.sentAt) / 1_000_000,
                            ).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="truncate text-xs text-muted-foreground">
                              {log.message}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Sent
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Add/Edit Modal */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="max-w-2xl" data-ocid="wa.template.modal">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editTemplate ? "Edit Template" : "New Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Template Name *</Label>
                <Input
                  value={tForm.name}
                  onChange={(e) =>
                    setTForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Monthly Due Reminder"
                  data-ocid="wa.template.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select
                  value={tForm.category}
                  onValueChange={(v) =>
                    setTForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger data-ocid="wa.template.category.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Message Body *</Label>
                <div className="flex gap-1 flex-wrap">
                  {VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="text-xs bg-muted hover:bg-muted/80 px-2 py-0.5 rounded font-mono transition-colors"
                      onClick={() => insertVariable(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={tForm.body}
                onChange={(e) =>
                  setTForm((f) => ({ ...f, body: e.target.value }))
                }
                rows={5}
                placeholder="Type your message. Use variables like {patient_name}, {clinic_name}..."
                data-ocid="wa.template.body.textarea"
              />
            </div>
            {/* Preview */}
            {tForm.body && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Preview (Sample Data)
                </Label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm whitespace-pre-wrap">
                  {resolveTemplate(
                    tForm.body,
                    { name: "Priya Sharma", phone: "9876543210" } as Patient,
                    {
                      clinicName: settings?.clinicName,
                      doctorName: settings?.doctorName,
                      phone: settings?.phone,
                    },
                    350,
                    "15 Apr 2026",
                    "Arnica 30C, Nux Vomica 30C",
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setTemplateModalOpen(false)}
              data-ocid="wa.template.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={saveTemplate}
              className="bg-primary text-primary-foreground"
              data-ocid="wa.template.save_button"
            >
              {editTemplate ? "Update" : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirm */}
      <AlertDialog
        open={!!deleteTemplateId}
        onOpenChange={(o) => !o && setDeleteTemplateId(null)}
      >
        <AlertDialogContent data-ocid="wa.delete_template.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="wa.delete_template.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTemplateId) {
                  store.deleteTemplate(deleteTemplateId);
                  toast.success("Template deleted");
                  setDeleteTemplateId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
              data-ocid="wa.delete_template.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Send Confirm */}
      <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <AlertDialogContent data-ocid="wa.bulk_send.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Send</AlertDialogTitle>
            <AlertDialogDescription>
              This will open WhatsApp for {selectedBulk.size} patients with 1.5s
              interval between each. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="wa.bulk_send.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkSend}
              className="bg-green-600 text-white"
              data-ocid="wa.bulk_send.confirm_button"
            >
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
