import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileSpreadsheet,
  Landmark,
  Trash2,
  Upload,
} from "lucide-react";
import { Fragment, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ─── Bank Configs ─────────────────────────────────────────────────────────────
const BANK_CONFIGS: Record<
  string,
  {
    name: string;
    color: string;
    badgeColor: string;
    dateCol: string[];
    descCol: string[];
    debitCol: string[];
    creditCol: string[];
    balanceCol: string[];
    refCol: string[];
  }
> = {
  AUTO: {
    name: "Auto Detect",
    color: "#6b7280",
    badgeColor: "bg-gray-100 text-gray-800",
    dateCol: [],
    descCol: [],
    debitCol: [],
    creditCol: [],
    balanceCol: [],
    refCol: [],
  },
  SBI: {
    name: "State Bank of India",
    color: "#2563eb",
    badgeColor: "bg-blue-100 text-blue-800",
    dateCol: [
      "Txn Date",
      "Date",
      "Transaction Date",
      "VALUE DATE",
      "Txn\nDate",
    ],
    descCol: [
      "Description",
      "Narration",
      "Particulars",
      "Remarks",
      "PARTICULARS",
    ],
    debitCol: ["Debit", "Withdrawal Amt.", "Debit Amount", "DR", "DEBIT"],
    creditCol: ["Credit", "Deposit Amt.", "Credit Amount", "CR", "CREDIT"],
    balanceCol: ["Balance", "Closing Balance", "Running Balance", "BALANCE"],
    refCol: ["Ref No./Cheque No.", "Reference No", "Chq/Ref No.", "Ref No"],
  },
  HDFC: {
    name: "HDFC Bank",
    color: "#dc2626",
    badgeColor: "bg-red-100 text-red-800",
    dateCol: ["Date", "Value Date", "Transaction Date"],
    descCol: [
      "Narration",
      "Description",
      "Transaction Description",
      "Particulars",
    ],
    debitCol: ["Withdrawal Amt.", "Debit", "Debit Amount", "Dr"],
    creditCol: ["Deposit Amt.", "Credit", "Credit Amount", "Cr"],
    balanceCol: ["Closing Balance", "Balance", "Running Balance"],
    refCol: ["Chq./Ref.No.", "Reference No.", "Cheque No", "Ref No"],
  },
  ICICI: {
    name: "ICICI Bank",
    color: "#ea580c",
    badgeColor: "bg-orange-100 text-orange-800",
    dateCol: ["Transaction Date", "Value Date", "Date"],
    descCol: ["Transaction Remarks", "Narration", "Description", "Particulars"],
    debitCol: [
      "Withdrawal Amount (INR )",
      "Debit",
      "Debit Amount",
      "DR Amount",
    ],
    creditCol: [
      "Deposit Amount (INR )",
      "Credit",
      "Credit Amount",
      "CR Amount",
    ],
    balanceCol: ["Balance (INR )", "Balance", "Closing Balance"],
    refCol: ["S No.", "Reference Number", "Cheque Number", "Ref No"],
  },
  AXIS: {
    name: "Axis Bank",
    color: "#7c3aed",
    badgeColor: "bg-purple-100 text-purple-800",
    dateCol: ["Tran Date", "Transaction Date", "Date", "Value Date"],
    descCol: ["PARTICULARS", "Particulars", "Narration", "Description"],
    debitCol: ["DR", "Debit", "Debit Amount", "Withdrawal"],
    creditCol: ["CR", "Credit", "Credit Amount", "Deposit"],
    balanceCol: ["BAL", "Balance", "Closing Balance", "Running Balance"],
    refCol: ["CHQNO", "Cheque No", "Reference No", "Ref No"],
  },
  PNB: {
    name: "Punjab National Bank",
    color: "#4338ca",
    badgeColor: "bg-indigo-100 text-indigo-800",
    dateCol: ["Posting Date", "Transaction Date", "Date", "Value Date"],
    descCol: ["Transaction Details", "Narration", "Particulars", "Description"],
    debitCol: ["Debit", "Dr Amount", "Withdrawal", "DR"],
    creditCol: ["Credit", "Cr Amount", "Deposit", "CR"],
    balanceCol: ["Balance", "Running Balance", "Closing Balance"],
    refCol: ["Instrument No.", "Reference No", "Cheque No", "Ref No"],
  },
  KOTAK: {
    name: "Kotak Mahindra Bank",
    color: "#dc2626",
    badgeColor: "bg-red-100 text-red-800",
    dateCol: ["Transaction Date", "Date", "Value Date"],
    descCol: ["Description", "Narration", "Particulars", "Transaction Details"],
    debitCol: ["Debit Amount", "Debit", "DR", "Withdrawal"],
    creditCol: ["Credit Amount", "Credit", "CR", "Deposit"],
    balanceCol: ["Running Balance", "Balance", "Closing Balance"],
    refCol: ["Reference Number", "Ref No", "Cheque No", "Instrument No"],
  },
  BOB: {
    name: "Bank of Baroda",
    color: "#ea580c",
    badgeColor: "bg-orange-100 text-orange-800",
    dateCol: ["Trans. Date", "Transaction Date", "Date", "Value Date"],
    descCol: ["Description", "Narration", "Particulars", "Transaction Remarks"],
    debitCol: ["Debit", "Withdrawal", "Dr", "Debit Amount"],
    creditCol: ["Credit", "Deposit", "Cr", "Credit Amount"],
    balanceCol: ["Balance", "Closing Balance", "Running Balance"],
    refCol: ["Cheque No.", "Reference No", "Ref No", "Instrument No"],
  },
  CANARA: {
    name: "Canara Bank",
    color: "#16a34a",
    badgeColor: "bg-green-100 text-green-800",
    dateCol: ["Date", "Transaction Date", "Value Date", "Posting Date"],
    descCol: ["Particulars", "Description", "Narration", "Transaction Details"],
    debitCol: ["Withdrawals", "Debit", "DR", "Debit Amount"],
    creditCol: ["Deposits", "Credit", "CR", "Credit Amount"],
    balanceCol: ["Balance", "Running Balance", "Closing Balance"],
    refCol: ["Ref/Chq No", "Cheque No", "Reference No", "Ref No"],
  },
};

const CATEGORIES = [
  "Auto-Detected",
  "Rent",
  "Electricity",
  "Salary",
  "Medicine Purchase",
  "Vendor Payment",
  "Bank Charges",
  "Tax/GST",
  "Miscellaneous",
  "Skip",
];

function autoCategory(desc: string): string {
  const d = desc.toUpperCase();
  if (d.includes("SALARY") || d.includes(" SAL ") || d.includes("/SAL/"))
    return "Salary";
  if (d.includes("RENT")) return "Rent";
  if (
    d.includes("ELEC") ||
    d.includes("ELECTRICITY") ||
    d.includes("BESCOM") ||
    d.includes("MSEDCL") ||
    d.includes("TSSPDCL") ||
    d.includes("TNEB")
  )
    return "Electricity";
  if (d.includes("GST") || d.includes(" TAX")) return "Tax/GST";
  if (
    d.includes("CHARGES") ||
    d.includes("FEE") ||
    d.includes("MAINTENANCE") ||
    d.includes("ANNUAL") ||
    d.includes("SMS CHARGE")
  )
    return "Bank Charges";
  if (
    (d.includes("NEFT") || d.includes("RTGS") || d.includes("IMPS")) &&
    (d.includes("VENDOR") ||
      d.includes("SUPPLIER") ||
      d.includes("PHARMA") ||
      d.includes("MEDICAL"))
  )
    return "Vendor Payment";
  if (
    d.includes("MEDICINE") ||
    d.includes("PHARMA") ||
    d.includes("DRUG") ||
    d.includes("HOMOEO") ||
    d.includes("HOMEO")
  )
    return "Medicine Purchase";
  return "Miscellaneous";
}

type ParsedTransaction = {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  refNo: string;
  category: string;
  selected: boolean;
};

type ImportRecord = {
  id: string;
  bankKey: string;
  bankName: string;
  importedAt: string;
  filename: string;
  transactions: ParsedTransaction[];
};

function formatDate(raw: string | number | undefined): string {
  if (!raw) return "";
  let d: Date | null = null;
  if (typeof raw === "number") {
    // Excel serial date
    d = new Date(Math.round((raw - 25569) * 86400 * 1000));
  } else {
    d = new Date(raw as string);
    if (Number.isNaN(d.getTime())) return String(raw);
  }
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseAmount(val: string | number | undefined): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[,₹\s]/g, "");
  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

function findCol(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex(
      (h) => h?.trim().toLowerCase() === c.toLowerCase(),
    );
    if (idx !== -1) return idx;
  }
  // partial match fallback
  for (const c of candidates) {
    const idx = headers.findIndex((h) =>
      h?.trim().toLowerCase().includes(c.toLowerCase()),
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

function detectBank(headers: string[]): string {
  let best = "SBI";
  let bestScore = 0;
  for (const [key, cfg] of Object.entries(BANK_CONFIGS)) {
    if (key === "AUTO") continue;
    const allCols = [
      ...cfg.dateCol,
      ...cfg.descCol,
      ...cfg.debitCol,
      ...cfg.creditCol,
    ];
    const score = allCols.filter((c) =>
      headers.some((h) => h?.trim().toLowerCase().includes(c.toLowerCase())),
    ).length;
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best;
}

function parseSheet(
  rows: (string | number)[][],
  bankKey: string,
): ParsedTransaction[] {
  if (rows.length < 2) return [];
  // Find header row
  let headerIdx = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    if (rows[i].filter((c) => c !== undefined && c !== "").length >= 3) {
      headerIdx = i;
      break;
    }
  }
  const headers = rows[headerIdx].map((h) => String(h ?? ""));
  const resolvedKey = bankKey === "AUTO" ? detectBank(headers) : bankKey;
  const cfg = BANK_CONFIGS[resolvedKey];

  const dateIdx = findCol(headers, cfg.dateCol);
  const descIdx = findCol(headers, cfg.descCol);
  const debitIdx = findCol(headers, cfg.debitCol);
  const creditIdx = findCol(headers, cfg.creditCol);
  const balIdx = findCol(headers, cfg.balanceCol);
  const refIdx = findCol(headers, cfg.refCol);

  const txns: ParsedTransaction[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const dateRaw = dateIdx !== -1 ? row[dateIdx] : undefined;
    const descRaw = descIdx !== -1 ? row[descIdx] : undefined;
    if (!dateRaw && !descRaw) continue;
    const debit = parseAmount(debitIdx !== -1 ? row[debitIdx] : undefined);
    const credit = parseAmount(creditIdx !== -1 ? row[creditIdx] : undefined);
    const balance = parseAmount(balIdx !== -1 ? row[balIdx] : undefined);
    const desc = String(descRaw ?? "").trim();
    txns.push({
      id: `txn-${i}-${Date.now()}`,
      date: formatDate(dateRaw as string | number | undefined),
      description: desc,
      debit,
      credit,
      balance,
      refNo: String(refIdx !== -1 ? (row[refIdx] ?? "") : ""),
      category: desc ? autoCategory(desc) : "Miscellaneous",
      selected: debit > 0,
    });
  }
  return txns.filter((t) => t.date || t.description);
}

function formatINR(n: number): string {
  if (!n) return "—";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function BankBadge({ bankKey }: { bankKey: string }) {
  const cfg = BANK_CONFIGS[bankKey];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg?.badgeColor ?? "bg-gray-100 text-gray-700"}`}
    >
      {cfg?.name ?? bankKey}
    </span>
  );
}

export default function BankImport() {
  const [selectedBank, setSelectedBank] = useState("AUTO");
  const [dragging, setDragging] = useState(false);
  const [filename, setFilename] = useState("");
  const [parsedBank, setParsedBank] = useState("");
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<ImportRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("bankImportHistory") ?? "[]");
    } catch {
      return [];
    }
  });

  const processFile = useCallback(
    (file: File) => {
      setFilename(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer;
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
            header: 1,
          });
          const txns = parseSheet(rows, selectedBank);
          const resolvedKey =
            selectedBank === "AUTO"
              ? detectBank(
                  (
                    rows.find(
                      (r) =>
                        r.filter((c) => c !== undefined && c !== "").length >=
                        3,
                    ) ?? []
                  ).map(String),
                )
              : selectedBank;
          setParsedBank(resolvedKey);
          setTransactions(txns);
          if (txns.length === 0) {
            toast.error(
              "No transactions found. Check the file format or select the correct bank.",
            );
          } else {
            toast.success(
              `Parsed ${txns.length} transactions from ${BANK_CONFIGS[resolvedKey]?.name ?? resolvedKey}`,
            );
          }
        } catch (err) {
          toast.error(
            "Failed to read file. Please upload a valid Excel or CSV file.",
          );
          console.error(err);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [selectedBank],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const updateTxn = (id: string, patch: Partial<ParsedTransaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  };

  const selectAll = (val: boolean) => {
    setTransactions((prev) => prev.map((t) => ({ ...t, selected: val })));
  };

  const totalDebits = transactions.reduce((s, t) => s + t.debit, 0);
  const totalCredits = transactions.reduce((s, t) => s + t.credit, 0);
  const selectedCount = transactions.filter((t) => t.selected).length;

  const handleImport = () => {
    const selected = transactions.filter(
      (t) => t.selected && t.category !== "Skip",
    );
    if (selected.length === 0) {
      toast.error("No transactions selected.");
      return;
    }

    const record: ImportRecord = {
      id: `import-${Date.now()}`,
      bankKey: parsedBank,
      bankName: BANK_CONFIGS[parsedBank]?.name ?? parsedBank,
      importedAt: new Date().toISOString(),
      filename,
      transactions: selected,
    };

    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem("bankImportHistory", JSON.stringify(newHistory));

    // Merge into expenses
    const existing = JSON.parse(localStorage.getItem("expenses") ?? "[]");
    const newExpenses = selected
      .filter((t) => t.debit > 0)
      .map((t) => ({
        id: `exp-bank-${t.id}`,
        date: t.date,
        description: t.description,
        category: t.category === "Auto-Detected" ? "Miscellaneous" : t.category,
        amount: t.debit,
        paymentMode: "Bank Transfer",
        reference: t.refNo,
        source: "Bank Import",
        bank: record.bankName,
      }));
    localStorage.setItem(
      "expenses",
      JSON.stringify([...existing, ...newExpenses]),
    );

    toast.success(`${selected.length} transactions imported successfully!`);
    setTransactions([]);
    setFilename("");
  };

  const downloadTemplate = (bankKey: string) => {
    const cfg = BANK_CONFIGS[bankKey];
    const headers = [
      cfg.dateCol[0],
      cfg.descCol[0],
      cfg.debitCol[0],
      cfg.creditCol[0],
      cfg.balanceCol[0],
      cfg.refCol[0],
    ];
    const sample = [
      headers,
      [
        "01 Jan 2026",
        "NEFT - Vendor Payment - ABC Pharma",
        "5000",
        "",
        "95000",
        "REF001",
      ],
      ["02 Jan 2026", "SALARY - Dr Sharma", "15000", "", "80000", "SAL001"],
      ["03 Jan 2026", "Deposit - Patient Fees", "", "12000", "92000", "DEP001"],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sample);
    XLSX.utils.book_append_sheet(wb, ws, "Statement");
    XLSX.writeFile(wb, `${bankKey}_statement_template.xlsx`);
  };

  const deleteHistory = (id: string) => {
    const newHistory = history.filter((h) => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem("bankImportHistory", JSON.stringify(newHistory));
    setDeleteTarget(null);
    toast.success("Import record deleted.");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "oklch(0.42 0.12 152)" }}
        >
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1
            className="text-2xl font-heading font-bold"
            style={{ color: "oklch(0.32 0.1 152)" }}
          >
            Bank Statement Import
          </h1>
          <p className="text-sm text-gray-500">
            Import and categorize bank transactions for SBI, HDFC, ICICI, Axis,
            PNB & more
          </p>
        </div>
      </div>

      <Tabs defaultValue="import">
        <TabsList className="mb-4">
          <TabsTrigger value="import" data-ocid="bank_import.import.tab">
            Import Statement
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="bank_import.history.tab">
            Import History
          </TabsTrigger>
        </TabsList>

        {/* ── Import Tab ── */}
        <TabsContent value="import" className="space-y-5">
          {/* Bank Selector + Template Download */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">
                Select Bank
              </span>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger
                  className="w-56"
                  data-ocid="bank_import.bank.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BANK_CONFIGS).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {key === "AUTO" ? "🔍 Auto Detect" : cfg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBank !== "AUTO" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate(selectedBank)}
                data-ocid="bank_import.download_template.button"
              >
                <Download className="w-4 h-4 mr-1" /> Download Template
              </Button>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              {Object.entries(BANK_CONFIGS)
                .filter(([k]) => k !== "AUTO")
                .map(([key]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => downloadTemplate(key)}
                    className={`px-2 py-1 rounded text-xs font-medium ${BANK_CONFIGS[key].badgeColor} hover:opacity-80 transition-opacity`}
                  >
                    {key}
                  </button>
                ))}
            </div>
          </div>

          {/* Drop Zone */}
          <div
            data-ocid="bank_import.dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/50"
            }`}
          >
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              Drag & drop your bank statement here
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports .xlsx, .xls, .csv
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              data-ocid="bank_import.upload_button"
            >
              <Upload className="w-4 h-4 mr-1" /> Browse File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Summary Bar */}
          {transactions.length > 0 && (
            <div
              className="rounded-lg border p-4 flex flex-wrap gap-6 items-center"
              style={{
                backgroundColor: "oklch(0.97 0.02 152)",
                borderColor: "oklch(0.85 0.05 152)",
              }}
            >
              <div>
                <p className="text-xs text-gray-500">Detected Bank</p>
                <BankBadge bankKey={parsedBank} />
              </div>
              <div>
                <p className="text-xs text-gray-500">File</p>
                <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                  {filename}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Rows</p>
                <p className="text-sm font-semibold">{transactions.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Debits</p>
                <p className="text-sm font-semibold text-red-600">
                  {formatINR(totalDebits)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Credits</p>
                <p className="text-sm font-semibold text-green-600">
                  {formatINR(totalCredits)}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectAll(true)}
                  data-ocid="bank_import.select_all.button"
                >
                  <CheckSquare className="w-4 h-4 mr-1" /> Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectAll(false)}
                  data-ocid="bank_import.deselect_all.button"
                >
                  Deselect All
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  data-ocid="bank_import.import_selected.button"
                  style={{ backgroundColor: "oklch(0.42 0.12 152)" }}
                  className="text-white"
                >
                  Import Selected ({selectedCount})
                </Button>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {transactions.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow
                      style={{ backgroundColor: "oklch(0.42 0.12 152)" }}
                    >
                      <TableHead className="text-white w-10">#</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">
                        Description / Narration
                      </TableHead>
                      <TableHead className="text-white text-right">
                        Debit (₹)
                      </TableHead>
                      <TableHead className="text-white text-right">
                        Credit (₹)
                      </TableHead>
                      <TableHead className="text-white text-right">
                        Balance (₹)
                      </TableHead>
                      <TableHead className="text-white">Ref No</TableHead>
                      <TableHead className="text-white">Category</TableHead>
                      <TableHead className="text-white text-center">
                        Import
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn, idx) => (
                      <TableRow
                        key={txn.id}
                        data-ocid={`bank_import.transaction.item.${idx + 1}`}
                        className={txn.debit > 0 ? "bg-red-50" : "bg-green-50"}
                      >
                        <TableCell className="text-xs text-gray-500">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {txn.date}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs">
                          <p className="truncate" title={txn.description}>
                            {txn.description}
                          </p>
                        </TableCell>
                        <TableCell className="text-right text-xs text-red-600 font-medium">
                          {txn.debit > 0 ? formatINR(txn.debit) : ""}
                        </TableCell>
                        <TableCell className="text-right text-xs text-green-600 font-medium">
                          {txn.credit > 0 ? formatINR(txn.credit) : ""}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {txn.balance > 0 ? formatINR(txn.balance) : ""}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {txn.refNo}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={txn.category}
                            onValueChange={(v) =>
                              updateTxn(txn.id, { category: v })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs w-40">
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
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={txn.selected}
                            onCheckedChange={(v) =>
                              updateTxn(txn.id, { selected: !!v })
                            }
                            data-ocid={`bank_import.transaction.checkbox.${idx + 1}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {transactions.length === 0 && (
            <div
              className="text-center py-16 text-gray-400"
              data-ocid="bank_import.empty_state"
            >
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No file uploaded yet</p>
              <p className="text-sm mt-1">
                Upload a bank statement Excel file to preview and import
                transactions
              </p>
            </div>
          )}
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <div
              className="text-center py-16 text-gray-400"
              data-ocid="bank_import.history.empty_state"
            >
              <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No import history</p>
              <p className="text-sm mt-1">
                Imported bank statements will appear here
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: "oklch(0.42 0.12 152)" }}>
                    <TableHead className="text-white">Bank</TableHead>
                    <TableHead className="text-white">File</TableHead>
                    <TableHead className="text-white">Import Date</TableHead>
                    <TableHead className="text-white text-right">
                      # Txns
                    </TableHead>
                    <TableHead className="text-white text-right">
                      Total Debits
                    </TableHead>
                    <TableHead className="text-white text-right">
                      Total Credits
                    </TableHead>
                    <TableHead className="text-white text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((rec, idx) => {
                    const totalD = rec.transactions.reduce(
                      (s, t) => s + t.debit,
                      0,
                    );
                    const totalC = rec.transactions.reduce(
                      (s, t) => s + t.credit,
                      0,
                    );
                    const isExpanded = expandedHistory === rec.id;
                    return (
                      <Fragment key={rec.id}>
                        <TableRow
                          data-ocid={`bank_import.history.item.${idx + 1}`}
                        >
                          <TableCell>
                            <BankBadge bankKey={rec.bankKey} />
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-xs">
                            <span
                              className="truncate block"
                              title={rec.filename}
                            >
                              {rec.filename}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(rec.importedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {rec.transactions.length}
                          </TableCell>
                          <TableCell className="text-right text-sm text-red-600 font-medium">
                            {formatINR(totalD)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-green-600 font-medium">
                            {formatINR(totalC)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedHistory(isExpanded ? null : rec.id)
                                }
                                data-ocid={`bank_import.history.view.${idx + 1}`}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(rec.id)}
                                className="text-red-500 hover:text-red-700"
                                data-ocid={`bank_import.history.delete.${idx + 1}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <div className="border-t bg-gray-50 p-4">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-xs">
                                        Date
                                      </TableHead>
                                      <TableHead className="text-xs">
                                        Description
                                      </TableHead>
                                      <TableHead className="text-xs text-right">
                                        Debit
                                      </TableHead>
                                      <TableHead className="text-xs text-right">
                                        Credit
                                      </TableHead>
                                      <TableHead className="text-xs">
                                        Category
                                      </TableHead>
                                      <TableHead className="text-xs">
                                        Ref No
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {rec.transactions.map((t) => (
                                      <TableRow
                                        key={t.id}
                                        className={
                                          t.debit > 0
                                            ? "bg-red-50/50"
                                            : "bg-green-50/50"
                                        }
                                      >
                                        <TableCell className="text-xs">
                                          {t.date}
                                        </TableCell>
                                        <TableCell className="text-xs max-w-sm">
                                          <span
                                            className="truncate block"
                                            title={t.description}
                                          >
                                            {t.description}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-red-600">
                                          {t.debit > 0
                                            ? formatINR(t.debit)
                                            : ""}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-green-600">
                                          {t.credit > 0
                                            ? formatINR(t.credit)
                                            : ""}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {t.category}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500">
                                          {t.refNo}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent data-ocid="bank_import.delete.dialog">
          <DialogHeader>
            <DialogTitle>Delete Import Record</DialogTitle>
            <DialogDescription>
              This will permanently remove this import record. The expense
              entries saved from this import will remain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="bank_import.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteHistory(deleteTarget)}
              data-ocid="bank_import.delete.confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
