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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  IndianRupee,
  MessageCircle,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Bill,
  PaymentStatus,
  useAddBillPayment,
  useAllBills,
  useAllVisits,
  useLowStockMedicines,
  useSearchPatients,
} from "../hooks/useQueries";
import {
  formatDate,
  formatRupees,
  isOnOrBefore,
  isSameDay,
  nowNanoseconds,
} from "../utils/formatters";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: patients } = useSearchPatients("");
  const { data: lowStock } = useLowStockMedicines();
  const { data: allBills } = useAllBills();
  const { data: allVisits } = useAllVisits();
  const addBillPayment = useAddBillPayment();

  const [collectBill, setCollectBill] = useState<Bill | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const today = new Date();
  const lowStockCount = lowStock?.length ?? 0;

  // Pending dues
  const pendingBills = (allBills ?? []).filter(
    (b) =>
      b.paymentStatus === PaymentStatus.pending ||
      b.paymentStatus === PaymentStatus.partial,
  );
  const pendingAmount = pendingBills.reduce(
    (sum, b) => sum + (b.totalAmount - b.paidAmount),
    0,
  );

  // Today's visits
  const todayVisits = (allVisits ?? []).filter((v) =>
    isSameDay(v.visitDate, today),
  );

  // Today's revenue: bills paid today
  const todayBills = (allBills ?? []).filter((b) =>
    isSameDay(b.billDate, today),
  );
  const todayCash = todayBills
    .filter((b) => (b.paymentMode ?? "").toLowerCase() === "cash")
    .reduce((s, b) => s + b.paidAmount, 0);
  const todayUPI = todayBills
    .filter((b) => (b.paymentMode ?? "").toLowerCase() === "upi")
    .reduce((s, b) => s + b.paidAmount, 0);
  const todayRevenue = todayBills.reduce((s, b) => s + b.paidAmount, 0);

  // Follow-ups due today or overdue
  const followUpsToday = (allVisits ?? []).filter(
    (v) => v.followUpDate !== null && isOnOrBefore(v.followUpDate, today),
  );

  const stats = [
    {
      title: "Today's Patients",
      value: todayVisits.length.toString(),
      sub: `${(patients ?? []).length} total registered`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ocid: "dashboard.patients.card",
    },
    {
      title: "Today's Revenue",
      value: formatRupees(todayRevenue),
      sub: `Cash: ${formatRupees(todayCash)} · UPI: ${formatRupees(todayUPI)}`,
      icon: IndianRupee,
      color: "text-green-600",
      bg: "bg-green-50",
      ocid: "dashboard.revenue.card",
    },
    {
      title: "Pending Dues",
      value: formatRupees(pendingAmount),
      sub: `${pendingBills.length} bills outstanding`,
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
      ocid: "dashboard.bills.card",
    },
    {
      title: "Follow-ups Due",
      value: followUpsToday.length.toString(),
      sub: followUpsToday.length > 0 ? "Needs attention" : "All clear",
      icon: Calendar,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ocid: "dashboard.followup.card",
    },
  ];

  const handleCollect = async () => {
    if (!collectBill || !payAmount) return;
    const amount = Number.parseFloat(payAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await addBillPayment.mutateAsync({
        billId: collectBill.id,
        payment: {
          date: nowNanoseconds(),
          amount,
          mode: payMode,
          reference: payRef || undefined,
          notes: payNotes || undefined,
        },
      });
      toast.success(`Payment of ${formatRupees(amount)} collected`);
      setCollectBill(null);
      setPayAmount("");
      setPayRef("");
      setPayNotes("");
    } catch {
      toast.error("Failed to collect payment");
    }
  };

  const visitTypeBadge = (type?: string) => {
    if (type === "Emergency")
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
          Emergency
        </Badge>
      );
    if (type === "Follow-up")
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
          Follow-up
        </Badge>
      );
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
        New
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back — here’s your clinic overview for today
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card" data-ocid={stat.ocid}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-heading font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {stat.sub}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bg} ml-3 shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Today’s Appointments
                {todayVisits.length > 0 && (
                  <Badge className="bg-primary text-primary-foreground">
                    {todayVisits.length}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary h-8 text-xs"
                onClick={() => navigate({ to: "/visits" })}
                data-ocid="dashboard.visits.link"
              >
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {todayVisits.length === 0 ? (
              <div
                className="text-center py-6 text-muted-foreground text-sm"
                data-ocid="dashboard.visits.empty_state"
              >
                No appointments today
              </div>
            ) : (
              <div className="space-y-2">
                {todayVisits.map((v, i) => {
                  const patient = (patients ?? []).find(
                    (p) => p.id === v.patientId,
                  );
                  return (
                    <div
                      key={v.id.toString()}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      data-ocid={`dashboard.visits.item.${i + 1}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "oklch(0.42 0.12 152)" }}
                      >
                        {patient?.name.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">
                            {patient?.name ?? "Unknown"}
                          </p>
                          <span className="text-xs text-muted-foreground font-mono">
                            {patient?.patientCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {v.visitTime && (
                            <span className="text-xs text-muted-foreground">
                              {v.visitTime}
                            </span>
                          )}
                          {visitTypeBadge(v.visitType)}
                        </div>
                      </div>
                      {patient && (
                        <a
                          href={`https://wa.me/91${patient.phone}?text=${encodeURIComponent(`Dear ${patient.name}, this is a reminder for your appointment today at Dr. Sharma's Homeopathy Clinic.`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Low Stock */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Low Stock
                  Alert
                  {lowStockCount > 0 && (
                    <Badge variant="destructive">{lowStockCount}</Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary h-7 text-xs"
                  onClick={() => navigate({ to: "/medicines" })}
                  data-ocid="dashboard.medicines.link"
                >
                  View <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {lowStockCount === 0 ? (
                <div
                  className="text-center py-3 text-muted-foreground text-xs"
                  data-ocid="dashboard.stock.empty_state"
                >
                  All stock levels OK
                </div>
              ) : (
                <div className="space-y-1.5">
                  {lowStock?.slice(0, 4).map((m, i) => (
                    <div
                      key={m.id.toString()}
                      className="flex items-center justify-between p-2 rounded bg-red-50"
                      data-ocid={`dashboard.stock.item.${i + 1}`}
                    >
                      <div>
                        <p className="text-xs font-medium text-red-800">
                          {m.name}{" "}
                          <span className="text-red-600">{m.potency}</span>
                        </p>
                        <p className="text-xs text-red-500">
                          Min: {Number(m.minStockLevel)}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {Number(m.quantity)} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Dues */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-heading">
                  Pending Dues
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary h-7 text-xs"
                  onClick={() => navigate({ to: "/billing" })}
                  data-ocid="dashboard.bills.link"
                >
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingBills.length === 0 ? (
                <div className="text-center py-3 text-muted-foreground text-xs">
                  No pending dues
                </div>
              ) : (
                <div className="space-y-1.5">
                  {pendingBills.slice(0, 4).map((b, i) => {
                    const patient = (patients ?? []).find(
                      (p) => p.id === b.patientId,
                    );
                    const due = b.totalAmount - b.paidAmount;
                    return (
                      <div
                        key={b.id.toString()}
                        className="flex items-center justify-between p-2 rounded bg-orange-50"
                        data-ocid={`dashboard.bills.item.${i + 1}`}
                      >
                        <div>
                          <p className="text-xs font-medium">
                            {patient?.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {b.billNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-orange-600">
                            {formatRupees(due)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => {
                              setCollectBill(b);
                              setPayAmount(due.toFixed(2));
                              setPayMode("Cash");
                              setPayRef("");
                              setPayNotes("");
                            }}
                            data-ocid={`dashboard.bills.collect_button.${i + 1}`}
                          >
                            Collect
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Follow-up Alerts */}
      {followUpsToday.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Follow-up
              Alerts
              <Badge className="bg-amber-100 text-amber-800">
                {followUpsToday.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {followUpsToday.map((v, i) => {
                const patient = (patients ?? []).find(
                  (p) => p.id === v.patientId,
                );
                return (
                  <div
                    key={v.id.toString()}
                    className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200"
                    data-ocid={`dashboard.followup.item.${i + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {patient?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-amber-700">
                        Due: {v.followUpDate ? formatDate(v.followUpDate) : "—"}
                      </p>
                    </div>
                    {patient && (
                      <a
                        href={`https://wa.me/91${patient.phone}?text=${encodeURIComponent(`Dear ${patient.name}, this is a follow-up reminder from Dr. Sharma's Homeopathy Clinic. Please call 9876543210 to schedule.`)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collect Payment Modal */}
      <Dialog
        open={!!collectBill}
        onOpenChange={(o) => !o && setCollectBill(null)}
      >
        <DialogContent className="max-w-sm" data-ocid="dashboard.payment.modal">
          <DialogHeader>
            <DialogTitle className="font-heading">Collect Payment</DialogTitle>
          </DialogHeader>
          {collectBill && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Invoice:</span>{" "}
                  {collectBill.billNumber}
                </p>
                <p>
                  <span className="text-muted-foreground">Patient:</span>{" "}
                  {(patients ?? []).find((p) => p.id === collectBill.patientId)
                    ?.name ?? "Unknown"}
                </p>
                <p>
                  <span className="text-muted-foreground">Total:</span>{" "}
                  {formatRupees(collectBill.totalAmount)}
                </p>
                <p>
                  <span className="text-muted-foreground">Due:</span>{" "}
                  <strong className="text-orange-600">
                    {formatRupees(
                      collectBill.totalAmount - collectBill.paidAmount,
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
                  data-ocid="dashboard.payment.amount.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <Select value={payMode} onValueChange={setPayMode}>
                  <SelectTrigger data-ocid="dashboard.payment.mode.select">
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
                <Label>Reference / UPI ID</Label>
                <Input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Optional"
                  data-ocid="dashboard.payment.ref.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                  data-ocid="dashboard.payment.notes.textarea"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCollectBill(null)}
              data-ocid="dashboard.payment.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCollect}
              className="bg-primary text-primary-foreground"
              data-ocid="dashboard.payment.confirm_button"
            >
              Collect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="text-center text-xs text-muted-foreground pt-4 border-t">
        &copy; {new Date().getFullYear()}. Built with ❤ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-primary"
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
