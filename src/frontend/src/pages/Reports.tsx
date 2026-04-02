import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  PaymentStatus,
  useAllBills,
  useAllMedicines,
  useAllVisits,
  useExpenses,
  usePurchases,
  useSearchPatients,
} from "../hooks/useQueries";
import { useMockStore } from "../store/mockData";
import { formatDate, formatRupees } from "../utils/formatters";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getMonthLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
}

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns) / 1_000_000);
}

export default function Reports() {
  const { data: allBills } = useAllBills();
  const { data: allExpenses } = useExpenses();
  const { data: allVisits } = useAllVisits();
  const { data: medicines } = useAllMedicines();
  const { data: allPatients } = useSearchPatients("");
  const { data: allPurchases } = usePurchases();

  const reportRef = useRef<HTMLDivElement>(null);

  const [dailyDate, setDailyDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const now = new Date();

  // Last 12 months for charts
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      label: getMonthLabel(d),
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });

  // Last 6 months for P&L table
  const last6Months = last12Months.slice(6);

  // Build data maps
  const revenueByMonth = new Map<string, number>();
  const expenseByMonth = new Map<string, number>();
  const purchaseByMonth = new Map<string, number>();
  const visitsByMonth = new Map<string, number>();
  const newPatientsByMonth = new Map<string, number>();

  for (const m of last12Months) {
    revenueByMonth.set(m.label, 0);
    expenseByMonth.set(m.label, 0);
    purchaseByMonth.set(m.label, 0);
    visitsByMonth.set(m.label, 0);
    newPatientsByMonth.set(m.label, 0);
  }

  for (const b of allBills ?? []) {
    const label = getMonthLabel(nsToDate(b.billDate));
    if (revenueByMonth.has(label))
      revenueByMonth.set(
        label,
        (revenueByMonth.get(label) ?? 0) + b.paidAmount,
      );
  }
  for (const e of allExpenses ?? []) {
    const label = getMonthLabel(nsToDate(e.date));
    if (expenseByMonth.has(label))
      expenseByMonth.set(label, (expenseByMonth.get(label) ?? 0) + e.amount);
  }
  for (const p of allPurchases ?? []) {
    const label = getMonthLabel(nsToDate(p.purchaseDate));
    if (purchaseByMonth.has(label))
      purchaseByMonth.set(
        label,
        (purchaseByMonth.get(label) ?? 0) + p.totalAmount,
      );
  }
  for (const v of allVisits ?? []) {
    const label = getMonthLabel(nsToDate(v.visitDate));
    if (visitsByMonth.has(label))
      visitsByMonth.set(label, (visitsByMonth.get(label) ?? 0) + 1);
  }
  for (const p of allPatients ?? []) {
    const label = getMonthLabel(nsToDate(p.createdAt));
    if (newPatientsByMonth.has(label))
      newPatientsByMonth.set(label, (newPatientsByMonth.get(label) ?? 0) + 1);
  }

  // Summary this month
  const thisMonthLabel = getMonthLabel(now);
  const thisMonthRevenue = revenueByMonth.get(thisMonthLabel) ?? 0;
  const thisMonthExpenses = expenseByMonth.get(thisMonthLabel) ?? 0;
  const thisMonthPurchases = purchaseByMonth.get(thisMonthLabel) ?? 0;
  const netPL = thisMonthRevenue - thisMonthExpenses - thisMonthPurchases;

  // Pending dues
  const pendingBills = (allBills ?? []).filter(
    (b) =>
      b.paymentStatus === PaymentStatus.pending ||
      b.paymentStatus === PaymentStatus.partial,
  );
  const totalPendingDues = pendingBills.reduce(
    (s, b) => s + (b.totalAmount - b.paidAmount),
    0,
  );

  // Low stock
  const lowStock = (medicines ?? []).filter(
    (m) => m.quantity <= m.minStockLevel,
  );

  // Revenue + Patient trend chart data
  const revenueChartData = last12Months.map((m) => ({
    month: m.label,
    revenue: Math.round(revenueByMonth.get(m.label) ?? 0),
    expenses: Math.round(expenseByMonth.get(m.label) ?? 0),
  }));

  const patientChartData = last12Months.map((m) => ({
    month: m.label,
    patients: newPatientsByMonth.get(m.label) ?? 0,
    visits: visitsByMonth.get(m.label) ?? 0,
  }));

  // P&L table
  const plData = last6Months.map((m) => ({
    month: m.label,
    income: Math.round(revenueByMonth.get(m.label) ?? 0),
    expenses: Math.round(expenseByMonth.get(m.label) ?? 0),
    purchases: Math.round(purchaseByMonth.get(m.label) ?? 0),
    net: Math.round(
      (revenueByMonth.get(m.label) ?? 0) -
        (expenseByMonth.get(m.label) ?? 0) -
        (purchaseByMonth.get(m.label) ?? 0),
    ),
  }));

  // Daily income report
  const dailyDateMs = dailyDate
    ? new Date(dailyDate).setHours(0, 0, 0, 0)
    : null;
  const dailyBills =
    dailyDateMs !== null
      ? (allBills ?? []).filter((b) => {
          const d = nsToDate(b.billDate);
          return d.setHours(0, 0, 0, 0) === dailyDateMs;
        })
      : [];
  const dailyCash = dailyBills
    .filter((b) => (b.paymentMode ?? "").toLowerCase() === "cash")
    .reduce((s, b) => s + b.paidAmount, 0);
  const dailyUPI = dailyBills
    .filter((b) => (b.paymentMode ?? "").toLowerCase() === "upi")
    .reduce((s, b) => s + b.paidAmount, 0);
  const dailyVisits =
    dailyDateMs !== null
      ? (allVisits ?? []).filter(
          (v) => nsToDate(v.visitDate).setHours(0, 0, 0, 0) === dailyDateMs,
        ).length
      : 0;

  // Pending dues per patient
  const pendingByPatient = new Map<
    string,
    { name: string; patientId: string; count: number; due: number }
  >();
  for (const b of pendingBills) {
    const key = b.patientId.toString();
    const patient = (allPatients ?? []).find((p) => p.id === b.patientId);
    const existing = pendingByPatient.get(key);
    const due = b.totalAmount - b.paidAmount;
    if (existing) {
      existing.count++;
      existing.due += due;
    } else {
      pendingByPatient.set(key, {
        name: patient?.name ?? "Unknown",
        patientId: key,
        count: 1,
        due,
      });
    }
  }

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

  const handleExportPLCSV = () => {
    const rows: string[][] = [
      [
        "Month",
        "Income (\u20b9)",
        "Expenses (\u20b9)",
        "Purchases (\u20b9)",
        "Net Profit (\u20b9)",
      ],
    ];
    for (const row of plData) {
      rows.push([
        row.month,
        String(row.income),
        String(row.expenses),
        String(row.purchases),
        String(row.net),
      ]);
    }
    downloadCSV("pl-report.csv", rows);
  };

  const handleExportPendingDuesCSV = () => {
    const rows: string[][] = [["Patient", "Bills Count", "Total Due (\u20b9)"]];
    for (const [, v] of pendingByPatient) {
      rows.push([v.name, String(v.count), v.due.toFixed(2)]);
    }
    downloadCSV("pending-dues.csv", rows);
  };

  const handleExportLowStockCSV = () => {
    const rows: string[][] = [
      ["Medicine", "Category", "Stock", "Reorder Level", "Status"],
    ];
    for (const m of lowStock) {
      rows.push([
        m.name,
        m.category,
        String(m.quantity),
        String(m.minStockLevel),
        Number(m.quantity) === 0 ? "Out of Stock" : "Low Stock",
      ]);
    }
    downloadCSV("low-stock.csv", rows);
  };

  const handlePrintReport = () => {
    const plRows = plData
      .map(
        (r) =>
          `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee">${r.month}</td>
          <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #eee;color:#16a34a">\u20b9${r.income.toLocaleString("en-IN")}</td>
          <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #eee;color:#d97706">\u20b9${r.expenses.toLocaleString("en-IN")}</td>
          <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #eee;color:#2563eb">\u20b9${r.purchases.toLocaleString("en-IN")}</td>
          <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #eee;font-weight:600;color:${r.net >= 0 ? "#1a6b4a" : "#dc2626"}">${r.net < 0 ? "-" : ""}\u20b9${Math.abs(r.net).toLocaleString("en-IN")}</td>
        </tr>`,
      )
      .join("");
    const pendingRows = [...pendingByPatient.values()]
      .map(
        (row) =>
          `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee">${row.name}</td>
          <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #eee">${row.count}</td>
          <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #eee;color:#d97706;font-weight:600">\u20b9${row.due.toFixed(2)}</td>
        </tr>`,
      )
      .join("");
    const lowStockRows = lowStock
      .map(
        (m) =>
          `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee">${m.name} <span style="color:#888;font-size:10pt">${m.potency}</span></td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee">${m.category}</td>
          <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #eee;color:#d97706">${Number(m.quantity)}</td>
          <td style="padding:6px 12px;text-align:right;border-bottom:1px solid #eee">${Number(m.minStockLevel)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee">${m.quantity === 0n ? "<span style='color:red'>Out of Stock</span>" : "<span style='color:orange'>Low Stock</span>"}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><title>Clinic Report - ${thisMonthLabel}</title>
    <style>body{font-family:Arial,sans-serif;font-size:11pt;color:#000;padding:16px}h2{color:#1a6b4a;margin-bottom:4px}h3{color:#333;margin:16px 0 8px}table{width:100%;border-collapse:collapse}th{background:#f5f5f5;padding:6px 12px;text-align:left;border-bottom:2px solid #ccc}.summary-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:20px}.summary-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px}@page{size:A4 portrait;margin:10mm}</style></head>
    <body>
    <div style="border-bottom:2px solid #1a6b4a;padding-bottom:8px;margin-bottom:16px">
      <h2 style="margin:0">Clinic Reports &amp; P&L</h2>
      <p style="margin:2px 0;color:#666">${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
    </div>
    <div class="summary-grid">
      <div class="summary-card"><p style="font-size:9pt;color:#666;margin:0">Monthly Income</p><p style="font-size:16pt;font-weight:bold;color:#16a34a;margin:2px 0">\u20b9${thisMonthRevenue.toLocaleString("en-IN")}</p></div>
      <div class="summary-card"><p style="font-size:9pt;color:#666;margin:0">Monthly Expenses</p><p style="font-size:16pt;font-weight:bold;color:#dc2626;margin:2px 0">\u20b9${thisMonthExpenses.toLocaleString("en-IN")}</p></div>
      <div class="summary-card"><p style="font-size:9pt;color:#666;margin:0">Medicine Purchases</p><p style="font-size:16pt;font-weight:bold;color:#2563eb;margin:2px 0">\u20b9${thisMonthPurchases.toLocaleString("en-IN")}</p></div>
      <div class="summary-card"><p style="font-size:9pt;color:#666;margin:0">Net Profit</p><p style="font-size:16pt;font-weight:bold;color:${netPL >= 0 ? "#1a6b4a" : "#dc2626"};margin:2px 0">${netPL < 0 ? "-" : ""}\u20b9${Math.abs(netPL).toLocaleString("en-IN")}</p></div>
    </div>
    <h3>Monthly P&L (Last 6 Months)</h3>
    <table><thead><tr><th>Month</th><th style="text-align:right">Income</th><th style="text-align:right">Expenses</th><th style="text-align:right">Purchases</th><th style="text-align:right">Net Profit</th></tr></thead><tbody>${plRows}</tbody></table>
    <h3>Pending Dues Summary &mdash; Total: \u20b9${totalPendingDues.toFixed(2)}</h3>
    ${pendingByPatient.size > 0 ? `<table><thead><tr><th>Patient</th><th style="text-align:right">Bills</th><th style="text-align:right">Total Due</th></tr></thead><tbody>${pendingRows}</tbody></table>` : "<p style='color:#666'>No pending dues</p>"}
    ${lowStock.length > 0 ? `<h3>Low Stock Medicines</h3><table><thead><tr><th>Medicine</th><th>Category</th><th style="text-align:right">Stock</th><th style="text-align:right">Reorder</th><th>Status</th></tr></thead><tbody>${lowStockRows}</tbody></table>` : ""}
    </body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 400);
    }
  };

  const handleExportPDF = () => {
    // Use print-to-PDF approach (same as print but user can save as PDF)
    handlePrintReport();
    setTimeout(() => {
      toast.success('In the print dialog, choose "Save as PDF" to download');
    }, 800);
  };

  // Stock Report computed data
  const stockReportData = (medicines ?? []).map((m) => {
    const movements = useMockStore
      .getState()
      .stockMovements.filter((mv) => mv.medicineId === m.id);
    const nowMs = Date.now();
    const monthStart = new Date(nowMs);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartNs = BigInt(monthStart.getTime()) * 1_000_000n;
    const periodMovements = movements.filter((mv) => mv.date >= monthStartNs);
    const purchased = periodMovements
      .filter((mv) => mv.type === "Add")
      .reduce((s, mv) => s + mv.qtyIn, 0);
    const dispensed = periodMovements
      .filter((mv) => mv.type === "Remove")
      .reduce((s, mv) => s + mv.qtyOut, 0);
    const adjusted = periodMovements
      .filter((mv) => mv.type === "Correction")
      .reduce((s, mv) => s + mv.qtyIn - mv.qtyOut, 0);
    const closingStock = Number(m.quantity);
    const openingStock = closingStock - purchased + dispensed - adjusted;
    return {
      id: m.id,
      name: `${m.name} ${m.potency}`,
      category: m.category,
      openingStock: Math.max(0, openingStock),
      purchased,
      dispensed,
      adjusted,
      closingStock,
      unit: m.stockUnit ?? "units",
      reorderLevel: Number(m.minStockLevel),
      unitPrice: m.purchasePrice ?? m.unitPrice,
      stockValue: closingStock * (m.purchasePrice ?? m.unitPrice),
      status: (closingStock === 0
        ? "Out"
        : closingStock <= Number(m.minStockLevel)
          ? "Low"
          : "OK") as "OK" | "Low" | "Out",
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            Reports &amp; P&amp;L
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Financial overview for {thisMonthLabel}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button
            variant="outline"
            onClick={handleExportPLCSV}
            className="gap-2"
            data-ocid="reports.export_pl_button"
            title="Export P&L as CSV"
          >
            <FileSpreadsheet className="w-4 h-4" /> P&amp;L CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPendingDuesCSV}
            className="gap-2"
            data-ocid="reports.export_dues_button"
            title="Export Pending Dues as CSV"
          >
            <Download className="w-4 h-4" /> Dues CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportLowStockCSV}
            className="gap-2"
            data-ocid="reports.export_stock_button"
            title="Export Low Stock as CSV"
          >
            <Download className="w-4 h-4" /> Stock CSV
          </Button>
          <Button
            variant="outline"
            onClick={handlePrintReport}
            className="gap-2"
            data-ocid="reports.print.button"
          >
            <Printer className="w-4 h-4" /> Print Report
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="gap-2"
            data-ocid="reports.export_pdf.button"
          >
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div ref={reportRef}>
        <Tabs defaultValue="pl" data-ocid="reports.tab">
          <TabsList>
            <TabsTrigger value="pl" data-ocid="reports.pl.tab">
              P&amp;L Overview
            </TabsTrigger>
            <TabsTrigger value="stock" data-ocid="reports.stock.tab">
              Stock Report
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pl" className="mt-4 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Monthly Income",
                  value: formatRupees(thisMonthRevenue),
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  title: "Monthly Expenses",
                  value: formatRupees(thisMonthExpenses),
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
                {
                  title: "Medicine Purchases",
                  value: formatRupees(thisMonthPurchases),
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  title: "Net Profit",
                  value: formatRupees(Math.abs(netPL)),
                  color: netPL >= 0 ? "text-primary" : "text-destructive",
                  bg: netPL >= 0 ? "bg-primary/10" : "bg-destructive/10",
                  prefix: netPL < 0 ? "-" : "",
                },
              ].map((stat) => (
                <Card key={stat.title} className="shadow-card">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p
                      className={`text-2xl font-heading font-bold mt-1 ${stat.color}`}
                    >
                      {(stat as { prefix?: string }).prefix}
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base font-heading">
                    Revenue vs Expenses (12 months)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `\u20b9${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(v: number) => formatRupees(v)} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="oklch(0.42 0.12 152)"
                        strokeWidth={2}
                        name="Revenue"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Expenses"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base font-heading">
                    Patient Trend (12 months)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={patientChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar
                        dataKey="patients"
                        fill="oklch(0.42 0.12 152)"
                        name="New Patients"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="visits"
                        fill="#93c5fd"
                        name="Total Visits"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly P&L Table */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-heading">
                  Monthly P&amp;L (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          Month
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                          Income \u20b9
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                          Expenses \u20b9
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                          Purchases \u20b9
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                          Net Profit \u20b9
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {plData.map((row) => (
                        <tr key={row.month} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium">{row.month}</td>
                          <td className="px-4 py-3 text-right text-green-700">
                            {formatRupees(row.income)}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-600">
                            {formatRupees(row.expenses)}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-600">
                            {formatRupees(row.purchases)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${row.net >= 0 ? "text-primary" : "text-destructive"}`}
                          >
                            {row.net < 0 ? "-" : ""}
                            {formatRupees(Math.abs(row.net))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Daily Income Report */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base font-heading">
                    Daily Income Report
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Select Date:</Label>
                    <Input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dailyDate && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Patients Seen",
                        value: dailyVisits.toString(),
                        color: "text-blue-600",
                      },
                      {
                        label: "Cash Collections",
                        value: formatRupees(dailyCash),
                        color: "text-green-600",
                      },
                      {
                        label: "UPI Collections",
                        value: formatRupees(dailyUPI),
                        color: "text-indigo-600",
                      },
                      {
                        label: "Total Revenue",
                        value: formatRupees(
                          dailyBills.reduce((s, b) => s + b.paidAmount, 0),
                        ),
                        color: "text-primary",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="p-3 rounded-lg bg-muted/30"
                      >
                        <p className="text-xs text-muted-foreground">
                          {item.label}
                        </p>
                        <p className={`text-xl font-bold mt-1 ${item.color}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {dailyBills.length === 0 && dailyDate && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No bills on{" "}
                    {formatDate(
                      BigInt(new Date(dailyDate).getTime()) * 1_000_000n,
                    )}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Report */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-heading">
                  Low Stock Report
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {lowStock.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    All medicines are adequately stocked
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Medicine
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Category
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Current Stock
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Reorder Level
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {lowStock.map((m, i) => (
                          <tr
                            key={m.id.toString()}
                            className="bg-amber-50/40"
                            data-ocid={`reports.low_stock.item.${i + 1}`}
                          >
                            <td className="px-4 py-3 font-medium">
                              {m.name}{" "}
                              <span className="text-xs text-muted-foreground">
                                {m.potency}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {m.category}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-amber-700">
                              {Number(m.quantity)}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {Number(m.minStockLevel)}
                            </td>
                            <td className="px-4 py-3">
                              {m.quantity === 0n ? (
                                <Badge variant="destructive">
                                  Out of Stock
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800">
                                  Low Stock
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Dues Summary */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-heading">
                    Pending Dues Summary
                  </CardTitle>
                  <span className="text-sm font-semibold text-orange-600">
                    Total: {formatRupees(totalPendingDues)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {pendingByPatient.size === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No pending dues
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Patient
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Bills
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Total Due \u20b9
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[...pendingByPatient.values()].map((row, i) => (
                          <tr
                            key={row.patientId}
                            className="hover:bg-muted/20"
                            data-ocid={`reports.pending.item.${i + 1}`}
                          >
                            <td className="px-4 py-3 font-medium">
                              {row.name}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {row.count}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-orange-600">
                              {formatRupees(row.due)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t bg-muted/30">
                          <td className="px-4 py-3 font-bold">Total</td>
                          <td className="px-4 py-3 text-right font-bold">
                            {pendingBills.length}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-orange-700">
                            {formatRupees(totalPendingDues)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <footer className="text-center text-xs text-muted-foreground pt-4 border-t no-print">
              &copy; {new Date().getFullYear()}. Built with \u2764 using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                className="underline hover:text-primary"
                target="_blank"
                rel="noreferrer"
              >
                caffeine.ai
              </a>
            </footer>
          </TabsContent>

          {/* Stock Report Tab */}
          <TabsContent value="stock" className="mt-4">
            <StockReportTab
              stockData={stockReportData}
              medicines={medicines ?? []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Stock Report Tab Component ────────────────────────────────────────────

interface StockRow {
  id: bigint;
  name: string;
  category: string;
  openingStock: number;
  purchased: number;
  dispensed: number;
  adjusted: number;
  closingStock: number;
  unit: string;
  reorderLevel: number;
  unitPrice: number;
  stockValue: number;
  status: "OK" | "Low" | "Out";
}

function StockReportTab({
  stockData,
  medicines,
}: { stockData: StockRow[]; medicines: { category: string }[] }) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [...new Set(medicines.map((m) => m.category))];

  const filtered = stockData.filter((row) => {
    if (filterCategory !== "all" && row.category !== filterCategory)
      return false;
    if (lowStockOnly && row.status === "OK") return false;
    if (
      searchTerm &&
      !row.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const totalMedicines = stockData.length;
  const lowStockCount = stockData.filter((r) => r.status === "Low").length;
  const outOfStockCount = stockData.filter((r) => r.status === "Out").length;
  const totalStockValue = stockData.reduce((s, r) => s + r.stockValue, 0);

  const handleExportExcel = () => {
    const headers = [
      "Medicine",
      "Category",
      "Opening Stock",
      "Purchased",
      "Dispensed",
      "Adjusted",
      "Closing Stock",
      "Unit",
      "Reorder Level",
      "Unit Price (Rs)",
      "Stock Value (Rs)",
      "Status",
    ];
    const rows = filtered.map((r) => [
      r.name,
      r.category,
      r.openingStock,
      r.purchased,
      r.dispensed,
      r.adjusted,
      r.closingStock,
      r.unit,
      r.reorderLevel,
      r.unitPrice,
      r.stockValue.toFixed(2),
      r.status,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const tableRows = filtered
      .map(
        (row) =>
          `<tr style="border-bottom:1px solid #eee">
          <td style="padding:5px">${row.name}</td>
          <td style="padding:5px">${row.category}</td>
          <td style="padding:5px;text-align:right">${row.openingStock}</td>
          <td style="padding:5px;text-align:right;color:green">${row.purchased > 0 ? `+${row.purchased}` : "\u2014"}</td>
          <td style="padding:5px;text-align:right;color:red">${row.dispensed > 0 ? `-${row.dispensed}` : "\u2014"}</td>
          <td style="padding:5px;text-align:right">${row.closingStock}</td>
          <td style="padding:5px">${row.unit}</td>
          <td style="padding:5px;text-align:right">\u20b9${row.stockValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
          <td style="padding:5px;color:${row.status === "Out" ? "red" : row.status === "Low" ? "orange" : "green"};font-weight:bold">${row.status}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><title>Stock Report</title>
    <style>body{font-family:Arial,sans-serif;font-size:10pt;padding:16px}table{width:100%;border-collapse:collapse}th{background:#f5f5f5;text-align:left;padding:5px;border-bottom:2px solid #ccc}h2{color:#1a6b4a}@page{size:A4 portrait;margin:10mm}</style></head>
    <body>
    <h2>Stock Report \u2014 ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</h2>
    <table><thead><tr><th>Medicine</th><th>Category</th><th style="text-align:right">Opening</th><th style="text-align:right">Purchased</th><th style="text-align:right">Dispensed</th><th style="text-align:right">Closing</th><th>Unit</th><th style="text-align:right">Value</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
    <p style="margin-top:12px;font-size:9pt;color:#666">Total Medicines: ${filtered.length} | Total Value: \u20b9${filtered.reduce((s, r) => s + r.stockValue, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Total Medicines
            </p>
            <p className="text-2xl font-heading font-bold mt-1 text-primary">
              {totalMedicines}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Low Stock
            </p>
            <p className="text-2xl font-heading font-bold mt-1 text-amber-600">
              {lowStockCount}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Out of Stock
            </p>
            <p className="text-2xl font-heading font-bold mt-1 text-red-600">
              {outOfStockCount}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Total Stock Value
            </p>
            <p className="text-xl font-heading font-bold mt-1 text-green-600">
              \u20b9
              {totalStockValue.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="w-52"
          placeholder="Search medicine..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-ocid="stock_report.search_input"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger
            className="w-44"
            data-ocid="stock_report.category.select"
          >
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox
            id="low-stock-filter"
            checked={lowStockOnly}
            onCheckedChange={(v) => setLowStockOnly(!!v)}
            data-ocid="stock_report.low_stock.checkbox"
          />
          <Label htmlFor="low-stock-filter" className="text-sm cursor-pointer">
            Low Stock Only
          </Label>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handlePrint}
            data-ocid="stock_report.print.button"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleExportExcel}
            data-ocid="stock_report.export.button"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="p-0" id="stock-report-print">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                    Medicine
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                    Opening
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                    Purchased
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                    Dispensed
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                    Adjusted
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                    Closing
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                    Unit
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                    Reorder
                  </th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                    Value \u20b9
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-10 text-muted-foreground"
                      data-ocid="stock_report.empty_state"
                    >
                      No medicines found
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr
                      key={row.id.toString()}
                      className={`hover:bg-muted/20 ${row.status === "Out" ? "bg-red-50/40" : row.status === "Low" ? "bg-amber-50/40" : ""}`}
                      data-ocid={`stock_report.item.${i + 1}`}
                    >
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.category}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.openingStock}
                      </td>
                      <td className="px-3 py-2 text-right text-green-700">
                        {row.purchased > 0 ? `+${row.purchased}` : "\u2014"}
                      </td>
                      <td className="px-3 py-2 text-right text-red-600">
                        {row.dispensed > 0 ? `-${row.dispensed}` : "\u2014"}
                      </td>
                      <td className="px-3 py-2 text-right text-blue-600">
                        {row.adjusted !== 0 ? row.adjusted : "\u2014"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {row.closingStock}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.unit}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {row.reorderLevel}
                      </td>
                      <td className="px-3 py-2 text-right">
                        \u20b9
                        {row.stockValue.toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-3 py-2">
                        {row.status === "Out" ? (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        ) : row.status === "Low" ? (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="p-3 border-t bg-muted/20 text-xs text-right text-muted-foreground">
              {filtered.length} medicines &middot; Total Stock Value:{" "}
              <strong className="text-foreground">
                \u20b9
                {filtered
                  .reduce((s, r) => s + r.stockValue, 0)
                  .toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </strong>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
