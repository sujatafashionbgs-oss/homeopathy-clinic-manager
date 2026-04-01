import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { useState } from "react";
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
import {
  PaymentStatus,
  useAllBills,
  useAllMedicines,
  useAllVisits,
  useExpenses,
  usePurchases,
  useSearchPatients,
} from "../hooks/useQueries";
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
    { name: string; count: number; due: number }
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
        "Income (₹)",
        "Expenses (₹)",
        "Purchases (₹)",
        "Net Profit (₹)",
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
    const rows: string[][] = [["Patient", "Bills Count", "Total Due (₹)"]];
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
            onClick={() => window.print()}
            className="gap-2"
            data-ocid="reports.print.button"
          >
            <Printer className="w-4 h-4" /> Print Report
          </Button>
        </div>
      </div>

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
                {(stat as any).prefix}
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
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
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
                    Income ₹
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Expenses ₹
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Purchases ₹
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Net Profit ₹
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
                <div key={item.label} className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
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
              {formatDate(BigInt(new Date(dailyDate).getTime()) * 1_000_000n)}
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
                          <Badge variant="destructive">Out of Stock</Badge>
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
                      Total Due ₹
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...pendingByPatient.values()].map((row, i) => (
                    <tr
                      key={row.name}
                      className="hover:bg-muted/20"
                      data-ocid={`reports.pending.item.${i + 1}`}
                    >
                      <td className="px-4 py-3 font-medium">{row.name}</td>
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
