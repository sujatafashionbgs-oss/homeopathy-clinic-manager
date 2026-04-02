import { create } from "zustand";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Gender = "male" | "female" | "other";
export type PaymentStatus = "pending" | "paid" | "partial";
export type UserRole = "Admin" | "Receptionist";

export interface Patient {
  id: bigint;
  patientCode: string;
  name: string;
  age: bigint;
  gender: Gender;
  phone: string;
  address: string;
  state: string;
  chiefComplaints: string;
  medicalHistory: string;
  isActive: boolean;
  createdAt: bigint;
  dob?: string;
  bloodGroup?: string;
  altPhone?: string;
  email?: string;
  city?: string;
  pincode?: string;
  occupation?: string;
  referredBy?: string;
  familyHistory?: string;
  allergies?: string;
}

export interface PrescriptionItem {
  medicineName: string;
  potency: string;
  quantity: string;
  unit: string;
  dosage: string;
  durationDays: number;
  notes?: string;
}

export interface Visit {
  id: bigint;
  patientId: bigint;
  visitDate: bigint;
  chiefComplaints: string;
  examination: string;
  diagnosis: string;
  prescription: string;
  followUpDate: bigint | null;
  medicinePrescribed: string;
  notes: string;
  isActive: boolean;
  visitType?: "New" | "Follow-up" | "Emergency";
  visitTime?: string;
  weight?: string;
  bp?: string;
  temperature?: string;
  symptoms?: string;
  diagnosisNotes?: string;
  generalNotes?: string;
  prescriptionInstructions?: string;
  prescriptionItems?: PrescriptionItem[];
}

export interface BillItem {
  name: string;
  quantity: number;
  rate: number;
  gstPercent: number;
  amount: number;
  discount?: number;
}

export interface PaymentRecord {
  date: bigint;
  amount: number;
  mode: string;
  reference?: string;
  notes?: string;
}

export interface Bill {
  id: bigint;
  billNumber: string;
  patientId: bigint;
  billDate: bigint;
  items: BillItem[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes: string;
  isActive: boolean;
  paymentMode?: string;
  paymentReference?: string;
  paymentHistory?: PaymentRecord[];
}

export interface Medicine {
  id: bigint;
  name: string;
  category: string;
  potency: string;
  quantity: bigint;
  minStockLevel: bigint;
  unitPrice: number;
  isActive: boolean;
  company?: string;
  form?: string;
  hsnCode?: string;
  batchNo?: string;
  expiryDate?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  stockUnit?: string;
  rackLocation?: string;
}

export interface StockMovement {
  id: bigint;
  medicineId: bigint;
  date: bigint;
  type: "Add" | "Remove" | "Correction";
  movementType?: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
  reference?: string;
  notes?: string;
  by?: string;
}

export interface Vendor {
  id: bigint;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  isActive: boolean;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface PurchaseItem {
  medicineId?: bigint;
  medicineName: string;
  qty: number;
  freeQty?: number;
  unit?: string;
  batch?: string;
  expiry?: string;
  rate: number;
  mrp?: number;
  gstPercent?: number;
  discountPercent?: number;
  amount: number;
}

export interface Purchase {
  id: bigint;
  poNumber: string;
  piNumber?: string;
  vendorId: bigint;
  invoiceNumber: string;
  purchaseDate: bigint;
  items: PurchaseItem[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: "paid" | "partial" | "unpaid";
  invoiceStatus?: "Draft" | "Confirmed" | "Paid" | "Partially Paid";
  paymentTerms?: number;
  dueDate?: bigint;
  billNotes?: string;
  isActive: boolean;
  medicineId?: bigint;
  quantity?: number;
  rate?: number;
}

export interface VendorPayment {
  id: bigint;
  vendorId: bigint;
  purchaseId?: bigint;
  amount: number;
  paymentDate: bigint;
  mode: string;
  reference: string;
  notes: string;
}

export interface Expense {
  id: bigint;
  category: string;
  description: string;
  amount: number;
  date: bigint;
  paidTo: string;
  notes: string;
  paymentMode?: string;
  referenceNo?: string;
}

export interface ClinicSettings {
  clinicName: string;
  doctorName: string;
  qualification: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  registrationNumber: string;
  gstNumber: string;
  enableGST: boolean;
  gstPercent: number;
  currency: string;
  logoUrl?: string;
}

export interface User {
  id: bigint;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

export interface MedicineCategory {
  id: bigint;
  name: string;
  description: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): bigint {
  return BigInt(Date.now() - n * 86400000) * 1_000_000n;
}

function daysFromNow(n: number): bigint {
  return BigInt(Date.now() + n * 86400000) * 1_000_000n;
}

function todayNs(): bigint {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return BigInt(d.getTime()) * 1_000_000n;
}

// ─── Initial Sample Data ──────────────────────────────────────────────────────

const INIT_PATIENTS: Patient[] = [
  {
    id: 1n,
    patientCode: "HC-00001",
    name: "Priya Sharma",
    age: 32n,
    gender: "female",
    phone: "9876543210",
    address: "45 Shivaji Nagar, Pune",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411005",
    chiefComplaints: "Chronic headaches, stress-related insomnia",
    medicalHistory: "Mild hypertension, no surgeries",
    familyHistory: "Father: Hypertension, Mother: Diabetes",
    allergies: "Penicillin",
    bloodGroup: "B+",
    dob: "1992-03-15",
    email: "priya.sharma@gmail.com",
    occupation: "Software Engineer",
    referredBy: "Dr. Meera Joshi",
    isActive: true,
    createdAt: daysAgo(60),
  },
  {
    id: 2n,
    patientCode: "HC-00002",
    name: "Rajesh Kumar",
    age: 45n,
    gender: "male",
    phone: "9811223344",
    address: "12 Lajpat Nagar, New Delhi",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110024",
    chiefComplaints: "Lower back pain, arthritis",
    medicalHistory: "Diabetes Type 2, no surgeries",
    familyHistory: "Father: Arthritis",
    allergies: "None known",
    bloodGroup: "O+",
    dob: "1979-07-22",
    occupation: "Business Owner",
    isActive: true,
    createdAt: daysAgo(45),
  },
  {
    id: 3n,
    patientCode: "HC-00003",
    name: "Ananya Patel",
    age: 28n,
    gender: "female",
    phone: "9924455667",
    address: "78 Satellite Road, Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380015",
    chiefComplaints: "Skin eczema, seasonal allergies",
    medicalHistory: "Asthma (mild), no surgeries",
    familyHistory: "Mother: Eczema",
    allergies: "Dust mites, pollen",
    bloodGroup: "A+",
    dob: "1996-11-08",
    email: "ananya.patel@yahoo.com",
    occupation: "Teacher",
    isActive: true,
    createdAt: daysAgo(30),
  },
  {
    id: 4n,
    patientCode: "HC-00004",
    name: "Mohan Das",
    age: 60n,
    gender: "male",
    phone: "9433221100",
    address: "5 Lake Town, Kolkata",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700089",
    chiefComplaints: "Digestive issues, bloating",
    medicalHistory: "Hypothyroidism, knee replacement 2018",
    bloodGroup: "AB+",
    dob: "1964-01-30",
    occupation: "Retired",
    isActive: true,
    createdAt: daysAgo(20),
  },
  {
    id: 5n,
    patientCode: "HC-00005",
    name: "Sunita Verma",
    age: 38n,
    gender: "female",
    phone: "9956781234",
    address: "33 Civil Lines, Lucknow",
    city: "Lucknow",
    state: "Uttar Pradesh",
    pincode: "226001",
    chiefComplaints: "Anxiety, palpitations",
    medicalHistory: "No significant history",
    allergies: "None",
    bloodGroup: "B-",
    dob: "1986-09-12",
    email: "sunita.verma@gmail.com",
    occupation: "Homemaker",
    isActive: true,
    createdAt: daysAgo(10),
  },
];

const INIT_VISITS: Visit[] = [
  {
    id: 1n,
    patientId: 1n,
    visitDate: daysAgo(14),
    visitType: "New",
    visitTime: "10:30",
    bp: "130/85",
    weight: "62 kg",
    temperature: "98.4",
    chiefComplaints: "Severe headache, worse in morning, better lying down",
    symptoms: "Throbbing headache, nausea, sensitivity to light",
    examination: "BP: 130/85 mmHg, Pulse: 78/min",
    diagnosis: "Tension headache with stress component",
    diagnosisNotes: "Stress-induced tension headache, likely work-related",
    prescription:
      "Belladonna 200C - 5 pills - SOS\nNux Vomica 30C - 3 pills - TDS - 7 days\nArnica 30C - 3 pills - OD - 14 days",
    prescriptionItems: [
      {
        medicineName: "Belladonna",
        potency: "200C",
        quantity: "5",
        unit: "globules",
        dosage: "SOS",
        durationDays: 7,
      },
      {
        medicineName: "Nux Vomica",
        potency: "30C",
        quantity: "3",
        unit: "globules",
        dosage: "TDS",
        durationDays: 7,
      },
      {
        medicineName: "Arnica Montana",
        potency: "30C",
        quantity: "3",
        unit: "globules",
        dosage: "OD",
        durationDays: 14,
      },
    ],
    prescriptionInstructions:
      "Avoid coffee. Follow stress management techniques.",
    followUpDate: daysAgo(1),
    medicinePrescribed: "Belladonna 200C, Nux Vomica 30C, Arnica 30C",
    notes: "Advised stress management. Avoid coffee.",
    isActive: true,
  },
  {
    id: 2n,
    patientId: 2n,
    visitDate: daysAgo(10),
    visitType: "New",
    visitTime: "11:15",
    bp: "125/82",
    weight: "78 kg",
    temperature: "98.6",
    chiefComplaints: "Severe lower back pain radiating to left leg",
    symptoms: "Radiating pain, worse on movement, better with heat",
    examination: "SLR positive left side, reduced lumbar flexion",
    diagnosis: "Lumbar spondylosis with nerve root compression",
    prescription:
      "Rhus Tox 30C - 3 pills - TDS - 10 days\nArnica Montana 200C - 5 pills - BD - 5 days",
    prescriptionItems: [
      {
        medicineName: "Rhus Tox",
        potency: "30C",
        quantity: "3",
        unit: "globules",
        dosage: "TDS",
        durationDays: 10,
      },
      {
        medicineName: "Arnica Montana",
        potency: "200C",
        quantity: "5",
        unit: "globules",
        dosage: "BD",
        durationDays: 5,
      },
    ],
    followUpDate: todayNs(),
    medicinePrescribed: "Rhus Tox 30C, Arnica Montana 200C",
    notes: "Hot compress advised. Avoid lifting heavy weights.",
    isActive: true,
  },
  {
    id: 3n,
    patientId: 3n,
    visitDate: daysAgo(7),
    visitType: "Follow-up",
    visitTime: "09:45",
    bp: "118/76",
    weight: "55 kg",
    chiefComplaints: "Itchy skin patches on arms and neck, worse at night",
    symptoms: "Erythematous patches, scaling, severe pruritus at night",
    examination: "Erythematous patches with scaling, no secondary infection",
    diagnosis: "Chronic eczema with allergic component",
    prescription:
      "Sulphur 30C - 3 pills - OD (evening) - 7 days\nPulsatilla 30C - 3 pills - TDS - 7 days",
    prescriptionItems: [
      {
        medicineName: "Sulphur",
        potency: "30C",
        quantity: "3",
        unit: "globules",
        dosage: "OD evening",
        durationDays: 7,
      },
      {
        medicineName: "Pulsatilla",
        potency: "30C",
        quantity: "3",
        unit: "globules",
        dosage: "TDS",
        durationDays: 7,
      },
    ],
    followUpDate: daysFromNow(7),
    medicinePrescribed: "Sulphur 30C, Pulsatilla 30C",
    notes: "Avoid synthetic fabrics. Use coconut oil for moisturizing.",
    isActive: true,
  },
  {
    id: 4n,
    patientId: 4n,
    visitDate: daysAgo(5),
    visitType: "New",
    visitTime: "10:00",
    weight: "72 kg",
    chiefComplaints: "Bloating after meals, gas, constipation",
    symptoms: "Post-meal bloating, flatulence, constipation 3-4 days",
    examination: "Mild tenderness in left iliac fossa",
    diagnosis: "Irritable bowel syndrome",
    prescription:
      "Nux Vomica 30C - 3 pills - TDS before meals - 7 days\nLycopodium 200C - 5 pills - OD - 10 days",
    prescriptionItems: [
      {
        medicineName: "Nux Vomica",
        potency: "30C",
        quantity: "3",
        unit: "globules",
        dosage: "TDS before meals",
        durationDays: 7,
      },
      {
        medicineName: "Lycopodium",
        potency: "200C",
        quantity: "5",
        unit: "globules",
        dosage: "OD",
        durationDays: 10,
      },
    ],
    followUpDate: null,
    medicinePrescribed: "Nux Vomica 30C, Lycopodium 200C",
    notes: "Dietary modifications advised. Increase fibre intake.",
    isActive: true,
  },
  {
    id: 5n,
    patientId: 5n,
    visitDate: daysAgo(3),
    visitType: "New",
    visitTime: "12:30",
    bp: "120/80",
    weight: "58 kg",
    temperature: "98.2",
    chiefComplaints: "Anxiety with palpitations, trembling hands",
    symptoms: "Anticipatory anxiety, heart palpitations, fine tremor",
    examination: "Pulse: 92/min, BP: 120/80 mmHg, mild tremor",
    diagnosis: "Anxiety disorder with somatic symptoms",
    prescription:
      "Gelsemium 30C - 3 pills - TDS - 7 days\nArgentum Nitricum 200C - 5 pills - OD - 7 days",
    prescriptionItems: [
      {
        medicineName: "Gelsemium",
        potency: "30C",
        quantity: "3",
        unit: "globules",
        dosage: "TDS",
        durationDays: 7,
      },
      {
        medicineName: "Argentum Nitricum",
        potency: "200C",
        quantity: "5",
        unit: "globules",
        dosage: "OD",
        durationDays: 7,
      },
    ],
    followUpDate: daysFromNow(4),
    medicinePrescribed: "Gelsemium 30C, Argentum Nitricum 200C",
    notes: "Pranayama and meditation recommended.",
    isActive: true,
  },
  {
    id: 6n,
    patientId: 1n,
    visitDate: todayNs(),
    visitType: "Follow-up",
    visitTime: "10:30",
    bp: "122/78",
    weight: "62 kg",
    chiefComplaints: "Follow-up - headaches improved 70%",
    symptoms: "Headaches much reduced, sleep better",
    examination: "BP: 122/78 mmHg, much better",
    diagnosis: "Tension headache - improving",
    prescription: "Arnica 30C - 3 pills - OD - 14 days (continue)",
    prescriptionItems: [
      {
        medicineName: "Arnica Montana",
        potency: "30C",
        quantity: "3",
        unit: "globules",
        dosage: "OD",
        durationDays: 14,
      },
    ],
    followUpDate: daysFromNow(14),
    medicinePrescribed: "Arnica 30C",
    notes: "Good response to treatment. Continue same.",
    isActive: true,
  },
];

const INIT_MEDICINES: Medicine[] = [
  {
    id: 1n,
    name: "Arnica Montana",
    category: "Single Remedy",
    potency: "30C",
    quantity: 45n,
    minStockLevel: 20n,
    unitPrice: 85,
    company: "SBL Pvt Ltd",
    form: "Globules",
    purchasePrice: 65,
    sellingPrice: 85,
    stockUnit: "globules",
    batchNo: "SBL2026001",
    expiryDate: "2027-06-30",
    rackLocation: "A-1",
    isActive: true,
  },
  {
    id: 2n,
    name: "Arnica Montana",
    category: "Single Remedy",
    potency: "200C",
    quantity: 30n,
    minStockLevel: 15n,
    unitPrice: 110,
    company: "SBL Pvt Ltd",
    form: "Globules",
    purchasePrice: 82,
    sellingPrice: 110,
    stockUnit: "globules",
    batchNo: "SBL2026002",
    expiryDate: "2027-06-30",
    rackLocation: "A-2",
    isActive: true,
  },
  {
    id: 3n,
    name: "Belladonna",
    category: "Single Remedy",
    potency: "200C",
    quantity: 8n,
    minStockLevel: 20n,
    unitPrice: 95,
    company: "Medisynth Ltd",
    form: "Dilution",
    purchasePrice: 72,
    sellingPrice: 95,
    stockUnit: "ml",
    batchNo: "MED2026015",
    expiryDate: "2026-12-31",
    rackLocation: "B-3",
    isActive: true,
  },
  {
    id: 4n,
    name: "Nux Vomica",
    category: "Single Remedy",
    potency: "30C",
    quantity: 55n,
    minStockLevel: 15n,
    unitPrice: 75,
    company: "SBL Pvt Ltd",
    form: "Globules",
    purchasePrice: 58,
    sellingPrice: 75,
    stockUnit: "globules",
    batchNo: "SBL2026010",
    expiryDate: "2027-03-31",
    rackLocation: "C-1",
    isActive: true,
  },
  {
    id: 5n,
    name: "Pulsatilla",
    category: "Single Remedy",
    potency: "30C",
    quantity: 12n,
    minStockLevel: 20n,
    unitPrice: 80,
    company: "Homeo Pharma India",
    form: "Globules",
    purchasePrice: 60,
    sellingPrice: 80,
    stockUnit: "globules",
    batchNo: "HPI2026008",
    expiryDate: "2027-01-31",
    rackLocation: "C-2",
    isActive: true,
  },
  {
    id: 6n,
    name: "Pulsatilla",
    category: "Single Remedy",
    potency: "200C",
    quantity: 40n,
    minStockLevel: 15n,
    unitPrice: 105,
    company: "Homeo Pharma India",
    form: "Globules",
    purchasePrice: 82,
    sellingPrice: 105,
    stockUnit: "globules",
    batchNo: "HPI2026009",
    expiryDate: "2027-03-31",
    rackLocation: "C-3",
    isActive: true,
  },
  {
    id: 7n,
    name: "Rhus Tox",
    category: "Single Remedy",
    potency: "30C",
    quantity: 35n,
    minStockLevel: 10n,
    unitPrice: 80,
    company: "Medisynth Ltd",
    form: "Dilution",
    purchasePrice: 60,
    sellingPrice: 80,
    stockUnit: "ml",
    batchNo: "MED2026020",
    expiryDate: "2027-06-30",
    rackLocation: "D-1",
    isActive: true,
  },
  {
    id: 8n,
    name: "Sulphur",
    category: "Single Remedy",
    potency: "30C",
    quantity: 5n,
    minStockLevel: 15n,
    unitPrice: 70,
    company: "SBL Pvt Ltd",
    form: "Globules",
    purchasePrice: 52,
    sellingPrice: 70,
    stockUnit: "globules",
    batchNo: "SBL2026022",
    expiryDate: "2026-09-30",
    rackLocation: "D-2",
    isActive: true,
  },
];

const INIT_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 1n,
    medicineId: 1n,
    date: daysAgo(30),
    type: "Add",
    movementType: "Purchase In",
    qtyIn: 50,
    qtyOut: 0,
    balance: 50,
    reference: "PI-2026-00001",
    notes: "Purchase from SBL",
    by: "Admin",
  },
  {
    id: 2n,
    medicineId: 1n,
    date: daysAgo(15),
    type: "Remove",
    movementType: "Dispensed to Patient",
    qtyIn: 0,
    qtyOut: 3,
    balance: 47,
    reference: "INV-2026-00001",
    notes: "Dispensed to Priya Sharma",
    by: "Admin",
  },
  {
    id: 3n,
    medicineId: 1n,
    date: daysAgo(10),
    type: "Remove",
    movementType: "Dispensed to Patient",
    qtyIn: 0,
    qtyOut: 2,
    balance: 45,
    reference: "INV-2026-00002",
    notes: "Dispensed to Rajesh Kumar",
    by: "Admin",
  },
  {
    id: 4n,
    medicineId: 3n,
    date: daysAgo(20),
    type: "Add",
    movementType: "Purchase In",
    qtyIn: 30,
    qtyOut: 0,
    balance: 30,
    reference: "PI-2026-00002",
    notes: "Purchase from Medisynth",
    by: "Admin",
  },
  {
    id: 5n,
    medicineId: 3n,
    date: daysAgo(7),
    type: "Remove",
    movementType: "Dispensed to Patient",
    qtyIn: 0,
    qtyOut: 22,
    balance: 8,
    reference: "INV-2026-00001",
    notes: "Dispensed - low stock now",
    by: "Admin",
  },
  {
    id: 6n,
    medicineId: 4n,
    date: daysAgo(15),
    type: "Add",
    movementType: "Purchase In",
    qtyIn: 60,
    qtyOut: 0,
    balance: 60,
    reference: "PI-2026-00003",
    notes: "Purchase from SBL",
    by: "Admin",
  },
  {
    id: 7n,
    medicineId: 4n,
    date: daysAgo(5),
    type: "Remove",
    movementType: "Dispensed to Patient",
    qtyIn: 0,
    qtyOut: 3,
    balance: 57,
    reference: "INV-2026-00004",
    notes: "Dispensed to Mohan Das",
    by: "Admin",
  },
  {
    id: 8n,
    medicineId: 4n,
    date: daysAgo(2),
    type: "Remove",
    movementType: "Dispensed to Patient",
    qtyIn: 0,
    qtyOut: 2,
    balance: 55,
    reference: "INV-2026-00002",
    notes: "Dispensed",
    by: "Admin",
  },
  {
    id: 9n,
    medicineId: 5n,
    date: daysAgo(25),
    type: "Add",
    movementType: "Purchase In",
    qtyIn: 30,
    qtyOut: 0,
    balance: 30,
    reference: "PI-2026-00001",
    notes: "Initial stock",
    by: "Admin",
  },
  {
    id: 10n,
    medicineId: 5n,
    date: daysAgo(10),
    type: "Remove",
    movementType: "Dispensed to Patient",
    qtyIn: 0,
    qtyOut: 10,
    balance: 20,
    reference: "INV-2026-00003",
    notes: "Dispensed",
    by: "Admin",
  },
  {
    id: 11n,
    medicineId: 5n,
    date: daysAgo(5),
    type: "Remove",
    movementType: "Dispensed to Patient",
    qtyIn: 0,
    qtyOut: 8,
    balance: 12,
    reference: "INV-2026-00003",
    notes: "Dispensed to Ananya",
    by: "Admin",
  },
  {
    id: 12n,
    medicineId: 8n,
    date: daysAgo(20),
    type: "Add",
    movementType: "Purchase In",
    qtyIn: 20,
    qtyOut: 0,
    balance: 20,
    reference: "PI-2026-00002",
    notes: "Stock purchased",
    by: "Admin",
  },
  {
    id: 13n,
    medicineId: 8n,
    date: daysAgo(8),
    type: "Remove",
    movementType: "Dispensed to Patient",
    qtyIn: 0,
    qtyOut: 10,
    balance: 10,
    reference: "INV-2026-00003",
    notes: "Dispensed",
    by: "Admin",
  },
  {
    id: 14n,
    medicineId: 8n,
    date: daysAgo(3),
    type: "Remove",
    movementType: "Dispensed to Patient",
    qtyIn: 0,
    qtyOut: 5,
    balance: 5,
    reference: "INV-2026-00003",
    notes: "Low stock",
    by: "Admin",
  },
];

const INIT_BILLS: Bill[] = [
  {
    id: 1n,
    billNumber: "INV-2026-00001",
    patientId: 1n,
    billDate: daysAgo(12),
    items: [
      {
        name: "Consultation Fee",
        quantity: 1,
        rate: 500,
        gstPercent: 0,
        discount: 0,
        amount: 500,
      },
      {
        name: "Arnica Montana 30C",
        quantity: 2,
        rate: 85,
        gstPercent: 5,
        discount: 0,
        amount: 178.5,
      },
      {
        name: "Nux Vomica 30C",
        quantity: 1,
        rate: 75,
        gstPercent: 5,
        discount: 0,
        amount: 78.75,
      },
    ],
    subtotal: 660,
    gstAmount: 17.25,
    totalAmount: 677.25,
    paidAmount: 677.25,
    paymentStatus: "paid",
    paymentMode: "Cash",
    notes: "Payment received in cash",
    paymentHistory: [
      {
        date: daysAgo(12),
        amount: 677.25,
        mode: "Cash",
        notes: "Full payment",
      },
    ],
    isActive: true,
  },
  {
    id: 2n,
    billNumber: "INV-2026-00002",
    patientId: 2n,
    billDate: daysAgo(9),
    items: [
      {
        name: "Consultation Fee",
        quantity: 1,
        rate: 500,
        gstPercent: 0,
        discount: 0,
        amount: 500,
      },
      {
        name: "Rhus Tox 30C",
        quantity: 2,
        rate: 80,
        gstPercent: 5,
        discount: 0,
        amount: 168,
      },
      {
        name: "Arnica Montana 200C",
        quantity: 1,
        rate: 110,
        gstPercent: 5,
        discount: 0,
        amount: 115.5,
      },
    ],
    subtotal: 690,
    gstAmount: 13.5,
    totalAmount: 703.5,
    paidAmount: 500,
    paymentStatus: "partial",
    paymentMode: "Cash",
    notes: "Balance ₹203.50 pending",
    paymentHistory: [
      { date: daysAgo(9), amount: 500, mode: "Cash", notes: "Advance payment" },
    ],
    isActive: true,
  },
  {
    id: 3n,
    billNumber: "INV-2026-00003",
    patientId: 3n,
    billDate: daysAgo(6),
    items: [
      {
        name: "Consultation Fee",
        quantity: 1,
        rate: 500,
        gstPercent: 0,
        discount: 0,
        amount: 500,
      },
      {
        name: "Sulphur 30C",
        quantity: 1,
        rate: 70,
        gstPercent: 5,
        discount: 0,
        amount: 73.5,
      },
      {
        name: "Pulsatilla 30C",
        quantity: 1,
        rate: 80,
        gstPercent: 5,
        discount: 0,
        amount: 84,
      },
    ],
    subtotal: 650,
    gstAmount: 7.5,
    totalAmount: 657.5,
    paidAmount: 0,
    paymentStatus: "pending",
    notes: "",
    isActive: true,
  },
  {
    id: 4n,
    billNumber: "INV-2026-00004",
    patientId: 4n,
    billDate: daysAgo(4),
    items: [
      {
        name: "Consultation Fee",
        quantity: 1,
        rate: 500,
        gstPercent: 0,
        discount: 0,
        amount: 500,
      },
      {
        name: "Nux Vomica 30C",
        quantity: 2,
        rate: 75,
        gstPercent: 5,
        discount: 0,
        amount: 157.5,
      },
    ],
    subtotal: 650,
    gstAmount: 7.5,
    totalAmount: 657.5,
    paidAmount: 657.5,
    paymentStatus: "paid",
    paymentMode: "UPI",
    notes: "Paid via UPI",
    paymentHistory: [
      {
        date: daysAgo(4),
        amount: 657.5,
        mode: "UPI",
        reference: "UPI2026040001",
        notes: "Full payment",
      },
    ],
    isActive: true,
  },
  {
    id: 5n,
    billNumber: "INV-2026-00005",
    patientId: 5n,
    billDate: daysAgo(2),
    items: [
      {
        name: "Consultation Fee",
        quantity: 1,
        rate: 500,
        gstPercent: 0,
        discount: 0,
        amount: 500,
      },
      {
        name: "Gelsemium 30C",
        quantity: 1,
        rate: 80,
        gstPercent: 5,
        discount: 0,
        amount: 84,
      },
      {
        name: "Argentum Nitricum 200C",
        quantity: 1,
        rate: 110,
        gstPercent: 5,
        discount: 0,
        amount: 115.5,
      },
    ],
    subtotal: 690,
    gstAmount: 9.95,
    totalAmount: 699.95,
    paidAmount: 0,
    paymentStatus: "pending",
    notes: "",
    isActive: true,
  },
];

const INIT_VENDORS: Vendor[] = [
  {
    id: 1n,
    name: "Homeo Pharma India",
    contactPerson: "Arun Mehta",
    phone: "9820011223",
    email: "orders@homeopharma.in",
    address: "Plot 5, MIDC Andheri, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    gstin: "27AABCH1234F1Z5",
    isActive: true,
  },
  {
    id: 2n,
    name: "Medisynth Ltd",
    contactPerson: "Suresh Rao",
    phone: "9900887766",
    email: "supply@medisynth.com",
    address: "14 Industrial Area, Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    gstin: "36AACCM5678G1Z3",
    isActive: true,
  },
  {
    id: 3n,
    name: "SBL Pvt Ltd",
    contactPerson: "Neha Gupta",
    phone: "9810456789",
    email: "orders@sblglobal.com",
    address: "22 Sector 16, Noida",
    city: "Noida",
    state: "Uttar Pradesh",
    gstin: "09AABCS9012H1Z8",
    isActive: true,
  },
];

const INIT_PURCHASES: Purchase[] = [
  {
    id: 1n,
    poNumber: "PO-2026-00001",
    piNumber: "PI-2026-00001",
    vendorId: 1n,
    invoiceNumber: "HPI-2026-001",
    purchaseDate: daysAgo(30),
    invoiceStatus: "Paid",
    paymentTerms: 30,
    dueDate: daysAgo(0),
    items: [
      {
        medicineId: 1n,
        medicineName: "Arnica Montana 30C",
        qty: 50,
        unit: "globules",
        batch: "SBL2026001",
        expiry: "2027-06-30",
        rate: 65,
        mrp: 85,
        gstPercent: 5,
        discountPercent: 0,
        amount: 3250,
      },
    ],
    subtotal: 3250,
    gstAmount: 162.5,
    totalAmount: 3412.5,
    paidAmount: 3412.5,
    status: "paid",
    billNotes: "Quality stock received. All 50 bottles checked.",
    isActive: true,
  },
  {
    id: 2n,
    poNumber: "PO-2026-00002",
    piNumber: "PI-2026-00002",
    vendorId: 2n,
    invoiceNumber: "MS-2026-045",
    purchaseDate: daysAgo(20),
    invoiceStatus: "Partially Paid",
    paymentTerms: 30,
    dueDate: daysFromNow(10),
    items: [
      {
        medicineId: 3n,
        medicineName: "Belladonna 200C",
        qty: 30,
        unit: "ml",
        batch: "MED2026015",
        expiry: "2026-12-31",
        rate: 72,
        mrp: 95,
        gstPercent: 5,
        discountPercent: 0,
        amount: 2160,
      },
    ],
    subtotal: 2160,
    gstAmount: 108,
    totalAmount: 2268,
    paidAmount: 2000,
    status: "partial",
    billNotes: "Partial payment made. Balance ₹268 due.",
    isActive: true,
  },
  {
    id: 3n,
    poNumber: "PO-2026-00003",
    piNumber: "PI-2026-00003",
    vendorId: 3n,
    invoiceNumber: "SBL-2026-112",
    purchaseDate: daysAgo(15),
    invoiceStatus: "Paid",
    paymentTerms: 15,
    dueDate: daysAgo(0),
    items: [
      {
        medicineId: 4n,
        medicineName: "Nux Vomica 30C",
        qty: 60,
        unit: "globules",
        batch: "SBL2026010",
        expiry: "2027-03-31",
        rate: 58,
        mrp: 75,
        gstPercent: 5,
        discountPercent: 0,
        amount: 3480,
      },
    ],
    subtotal: 3480,
    gstAmount: 174,
    totalAmount: 3654,
    paidAmount: 3654,
    status: "paid",
    billNotes: "",
    isActive: true,
  },
  {
    id: 4n,
    poNumber: "PO-2026-00004",
    piNumber: "PI-2026-00004",
    vendorId: 1n,
    invoiceNumber: "HPI-2026-002",
    purchaseDate: daysAgo(8),
    invoiceStatus: "Confirmed",
    paymentTerms: 45,
    dueDate: daysFromNow(37),
    items: [
      {
        medicineId: 6n,
        medicineName: "Pulsatilla 200C",
        qty: 40,
        unit: "globules",
        batch: "HPI2026009",
        expiry: "2027-03-31",
        rate: 82,
        mrp: 105,
        gstPercent: 5,
        discountPercent: 5,
        amount: 3124,
      },
    ],
    subtotal: 3124,
    gstAmount: 156.2,
    totalAmount: 3280.2,
    paidAmount: 0,
    status: "unpaid",
    billNotes: "Awaiting payment approval.",
    isActive: true,
  },
];

const INIT_VENDOR_PAYMENTS: VendorPayment[] = [
  {
    id: 1n,
    vendorId: 1n,
    purchaseId: 1n,
    amount: 3412.5,
    paymentDate: daysAgo(28),
    mode: "NEFT",
    reference: "TXN20260301",
    notes: "Full payment for HPI-2026-001",
  },
  {
    id: 2n,
    vendorId: 2n,
    purchaseId: 2n,
    amount: 2000,
    paymentDate: daysAgo(18),
    mode: "Cheque",
    reference: "CHQ001234",
    notes: "Partial payment",
  },
  {
    id: 3n,
    vendorId: 3n,
    purchaseId: 3n,
    amount: 3654,
    paymentDate: daysAgo(12),
    mode: "UPI",
    reference: "UPI240312SBL",
    notes: "Full payment",
  },
];

const INIT_EXPENSES: Expense[] = [
  {
    id: 1n,
    category: "Rent",
    description: "Clinic rent for March 2026",
    amount: 15000,
    date: daysAgo(15),
    paidTo: "Landlord - Suresh Patil",
    paymentMode: "Cheque",
    referenceNo: "CHQ-0045",
    notes: "",
  },
  {
    id: 2n,
    category: "Electricity",
    description: "Electricity bill",
    amount: 2500,
    date: daysAgo(10),
    paidTo: "MSEDCL",
    paymentMode: "UPI",
    referenceNo: "UPI-MSED-001",
    notes: "",
  },
  {
    id: 3n,
    category: "Salary",
    description: "Staff salary - March 2026",
    amount: 25000,
    date: daysAgo(5),
    paidTo: "Kavita Deshpande (Receptionist)",
    paymentMode: "Bank Transfer",
    referenceNo: "NEFT20260401",
    notes: "",
  },
  {
    id: 4n,
    category: "Miscellaneous",
    description: "Cotton, gauze, gloves, stationery",
    amount: 3000,
    date: daysAgo(8),
    paidTo: "Medical Supplies Store",
    paymentMode: "Cash",
    notes: "",
  },
  {
    id: 5n,
    category: "Telephone",
    description: "Internet + Phone bill",
    amount: 1200,
    date: daysAgo(3),
    paidTo: "Reliance Jio",
    paymentMode: "UPI",
    notes: "Monthly plan",
  },
];

const INIT_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: "Dr. Sharma's Homeopathy Clinic",
  doctorName: "Dr. Rajesh Sharma",
  qualification: "BHMS, MD (Hom)",
  address: "12 Healing Lane, Andheri West, Mumbai - 400053",
  phone: "9876543210",
  email: "contact@drsharmahomoeo.in",
  website: "www.drsharmahomoeo.in",
  registrationNumber: "MCI-HOM-2008-MH-4521",
  gstNumber: "27ABCDE1234F1Z5",
  enableGST: true,
  gstPercent: 18,
  currency: "INR",
};

const INIT_USERS: User[] = [
  {
    id: 1n,
    name: "Admin User",
    email: "admin@clinic.com",
    password: "admin123",
    role: "Admin",
    isActive: true,
  },
  {
    id: 2n,
    name: "Reception Staff",
    email: "reception@clinic.com",
    password: "reception123",
    role: "Receptionist",
    isActive: true,
  },
];

const INIT_CATEGORIES: MedicineCategory[] = [
  {
    id: 1n,
    name: "Single Remedy",
    description: "Pure single homeopathic medicines",
  },
  {
    id: 2n,
    name: "Mother Tincture",
    description: "Herbal extracts in alcohol base",
  },
  { id: 3n, name: "Biochemic", description: "Tissue salts / Schuessler salts" },
  {
    id: 4n,
    name: "Combination",
    description: "Proprietary combination remedies",
  },
  { id: 5n, name: "External Use", description: "Ointments, creams, liniments" },
  { id: 6n, name: "Other", description: "Miscellaneous homeopathic products" },
];

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
}

export interface WhatsAppLog {
  id: string;
  patientId: bigint;
  templateName: string;
  message: string;
  sentAt: bigint;
}

const INIT_WA_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "wt-1",
    name: "Due Payment Reminder (Hindi)",
    category: "Due Payment Reminder",
    body: "नमस्ते {patient_name} जी, आपका {clinic_name} में ₹{amount_due} बकाया है। कृपया जल्द भुगतान करें। संपर्क: {clinic_phone}",
  },
  {
    id: "wt-2",
    name: "Follow-up Reminder (Hindi)",
    category: "Follow-up Reminder",
    body: "नमस्ते {patient_name} जी, आपका {clinic_name} में {followup_date} को follow-up है। समय पर आएं। डॉ. {doctor_name}",
  },
  {
    id: "wt-3",
    name: "Prescription Send (Hindi)",
    category: "Prescription Send",
    body: "नमस्ते {patient_name} जी, आपकी दवाइयाँ: {medicines_list}। डॉ. {doctor_name} - {clinic_name}",
  },
  {
    id: "wt-4",
    name: "Due Payment Reminder (English)",
    category: "Due Payment Reminder",
    body: "Dear {patient_name}, you have a pending due of {amount_due} at {clinic_name}. Please clear it at your earliest. Contact: {clinic_phone}",
  },
  {
    id: "wt-5",
    name: "Follow-up Reminder (English)",
    category: "Follow-up Reminder",
    body: "Dear {patient_name}, your follow-up appointment is scheduled on {followup_date} at {clinic_name}. Please be on time. - Dr. {doctor_name}",
  },
];

// ─── Store Interface ──────────────────────────────────────────────────────────

interface MockDataState {
  patients: Patient[];
  visits: Visit[];
  bills: Bill[];
  medicines: Medicine[];
  vendors: Vendor[];
  purchases: Purchase[];
  vendorPayments: VendorPayment[];
  expenses: Expense[];
  clinicSettings: ClinicSettings;
  users: User[];
  medicineCategories: MedicineCategory[];
  stockMovements: StockMovement[];

  nextPatientId: bigint;
  nextVisitId: bigint;
  nextBillId: bigint;
  nextMedicineId: bigint;
  nextVendorId: bigint;
  nextPurchaseId: bigint;
  nextVendorPaymentId: bigint;
  nextExpenseId: bigint;
  nextUserId: bigint;
  nextCategoryId: bigint;
  nextBillNumber: number;
  nextPoNumber: number;
  nextPiNumber: number;
  nextStockMovementId: bigint;

  addPatient: (
    p: Omit<Patient, "id" | "patientCode" | "isActive" | "createdAt">,
  ) => bigint;
  updatePatient: (id: bigint, p: Partial<Patient>) => void;
  deletePatient: (id: bigint) => void;

  addVisit: (v: Omit<Visit, "id" | "isActive">) => bigint;
  updateVisit: (id: bigint, v: Partial<Visit>) => void;
  deleteVisit: (id: bigint) => void;

  addBill: (b: Omit<Bill, "id" | "billNumber" | "isActive">) => bigint;
  updateBill: (id: bigint, b: Partial<Bill>) => void;
  deleteBill: (id: bigint) => void;
  addBillPayment: (billId: bigint, payment: Omit<PaymentRecord, never>) => void;

  addMedicine: (m: Omit<Medicine, "id" | "isActive">) => bigint;
  updateMedicine: (id: bigint, m: Partial<Medicine>) => void;
  deleteMedicine: (id: bigint) => void;
  adjustStock: (id: bigint, delta: number) => void;

  addStockMovement: (m: Omit<StockMovement, "id">) => bigint;

  addVendor: (v: Omit<Vendor, "id" | "isActive">) => bigint;
  updateVendor: (id: bigint, v: Partial<Vendor>) => void;
  deleteVendor: (id: bigint) => void;

  addPurchase: (p: Omit<Purchase, "id" | "isActive">) => bigint;
  updatePurchase: (id: bigint, p: Partial<Purchase>) => void;
  deletePurchase: (id: bigint) => void;

  addVendorPayment: (p: Omit<VendorPayment, "id">) => bigint;

  addExpense: (e: Omit<Expense, "id">) => bigint;
  updateExpense: (id: bigint, e: Partial<Expense>) => void;
  deleteExpense: (id: bigint) => void;

  updateClinicSettings: (s: Partial<ClinicSettings>) => void;

  addUser: (u: Omit<User, "id">) => bigint;
  updateUser: (id: bigint, u: Partial<User>) => void;
  deleteUser: (id: bigint) => void;

  addMedicineCategory: (c: Omit<MedicineCategory, "id">) => bigint;
  updateMedicineCategory: (id: bigint, c: Partial<MedicineCategory>) => void;
  deleteMedicineCategory: (id: bigint) => void;

  whatsappTemplates: WhatsAppTemplate[];
  whatsappLogs: WhatsAppLog[];
  nextWaLogId: number;
  addTemplate: (t: Omit<WhatsAppTemplate, "id">) => void;
  updateTemplate: (id: string, t: Partial<WhatsAppTemplate>) => void;
  deleteTemplate: (id: string) => void;
  addLog: (l: Omit<WhatsAppLog, "id">) => void;
}

export const useMockStore = create<MockDataState>()((set, get) => ({
  patients: INIT_PATIENTS,
  visits: INIT_VISITS,
  bills: INIT_BILLS,
  medicines: INIT_MEDICINES,
  vendors: INIT_VENDORS,
  purchases: INIT_PURCHASES,
  vendorPayments: INIT_VENDOR_PAYMENTS,
  expenses: INIT_EXPENSES,
  clinicSettings: INIT_CLINIC_SETTINGS,
  users: INIT_USERS,
  medicineCategories: INIT_CATEGORIES,
  stockMovements: INIT_STOCK_MOVEMENTS,
  whatsappTemplates: INIT_WA_TEMPLATES,
  whatsappLogs: [],
  nextWaLogId: 1,

  nextPatientId: 6n,
  nextVisitId: 7n,
  nextBillId: 6n,
  nextMedicineId: 9n,
  nextVendorId: 4n,
  nextPurchaseId: 5n,
  nextVendorPaymentId: 4n,
  nextExpenseId: 6n,
  nextUserId: 3n,
  nextCategoryId: 7n,
  nextBillNumber: 6,
  nextPoNumber: 5,
  nextPiNumber: 5,
  nextStockMovementId: 15n,

  addPatient: (p) => {
    const id = get().nextPatientId;
    const code = `HC-${String(Number(id)).padStart(5, "0")}`;
    set((s) => ({
      patients: [
        ...s.patients,
        {
          ...p,
          id,
          patientCode: code,
          isActive: true,
          createdAt: BigInt(Date.now()) * 1_000_000n,
        },
      ],
      nextPatientId: id + 1n,
    }));
    return id;
  },
  updatePatient: (id, p) =>
    set((s) => ({
      patients: s.patients.map((x) => (x.id === id ? { ...x, ...p } : x)),
    })),
  deletePatient: (id) =>
    set((s) => ({ patients: s.patients.filter((x) => x.id !== id) })),

  addVisit: (v) => {
    const id = get().nextVisitId;
    set((s) => ({
      visits: [...s.visits, { ...v, id, isActive: true }],
      nextVisitId: id + 1n,
    }));
    return id;
  },
  updateVisit: (id, v) =>
    set((s) => ({
      visits: s.visits.map((x) => (x.id === id ? { ...x, ...v } : x)),
    })),
  deleteVisit: (id) =>
    set((s) => ({ visits: s.visits.filter((x) => x.id !== id) })),

  addBill: (b) => {
    const id = get().nextBillId;
    const num = get().nextBillNumber;
    const billNumber = `INV-${new Date().getFullYear()}-${String(num).padStart(5, "0")}`;
    set((s) => ({
      bills: [...s.bills, { ...b, id, billNumber, isActive: true }],
      nextBillId: id + 1n,
      nextBillNumber: num + 1,
    }));
    return id;
  },
  updateBill: (id, b) =>
    set((s) => ({
      bills: s.bills.map((x) => (x.id === id ? { ...x, ...b } : x)),
    })),
  deleteBill: (id) =>
    set((s) => ({ bills: s.bills.filter((x) => x.id !== id) })),
  addBillPayment: (billId, payment) =>
    set((s) => ({
      bills: s.bills.map((b) => {
        if (b.id !== billId) return b;
        const newPaid = b.paidAmount + payment.amount;
        const capped = Math.min(newPaid, b.totalAmount);
        const status: PaymentStatus =
          capped >= b.totalAmount ? "paid" : "partial";
        return {
          ...b,
          paidAmount: capped,
          paymentStatus: status,
          paymentMode: payment.mode,
          paymentReference: payment.reference,
          paymentHistory: [...(b.paymentHistory ?? []), payment],
        };
      }),
    })),

  addMedicine: (m) => {
    const id = get().nextMedicineId;
    set((s) => ({
      medicines: [...s.medicines, { ...m, id, isActive: true }],
      nextMedicineId: id + 1n,
    }));
    return id;
  },
  updateMedicine: (id, m) =>
    set((s) => ({
      medicines: s.medicines.map((x) => (x.id === id ? { ...x, ...m } : x)),
    })),
  deleteMedicine: (id) =>
    set((s) => ({ medicines: s.medicines.filter((x) => x.id !== id) })),
  adjustStock: (id, delta) =>
    set((s) => ({
      medicines: s.medicines.map((x) =>
        x.id === id
          ? { ...x, quantity: BigInt(Math.max(0, Number(x.quantity) + delta)) }
          : x,
      ),
    })),

  addStockMovement: (m) => {
    const id = get().nextStockMovementId;
    set((s) => ({
      stockMovements: [...s.stockMovements, { ...m, id }],
      nextStockMovementId: id + 1n,
    }));
    return id;
  },

  addVendor: (v) => {
    const id = get().nextVendorId;
    set((s) => ({
      vendors: [...s.vendors, { ...v, id, isActive: true }],
      nextVendorId: id + 1n,
    }));
    return id;
  },
  updateVendor: (id, v) =>
    set((s) => ({
      vendors: s.vendors.map((x) => (x.id === id ? { ...x, ...v } : x)),
    })),
  deleteVendor: (id) =>
    set((s) => ({ vendors: s.vendors.filter((x) => x.id !== id) })),

  addPurchase: (p) => {
    const id = get().nextPurchaseId;
    const num = get().nextPoNumber;
    const piNum = get().nextPiNumber;
    const poNumber =
      p.poNumber ||
      `PO-${new Date().getFullYear()}-${String(num).padStart(5, "0")}`;
    const piNumber =
      p.piNumber ||
      `PI-${new Date().getFullYear()}-${String(piNum).padStart(5, "0")}`;
    set((s) => ({
      purchases: [
        ...s.purchases,
        { ...p, id, poNumber, piNumber, isActive: true },
      ],
      nextPurchaseId: id + 1n,
      nextPoNumber: num + 1,
      nextPiNumber: piNum + 1,
    }));
    return id;
  },
  updatePurchase: (id, p) =>
    set((s) => ({
      purchases: s.purchases.map((x) => (x.id === id ? { ...x, ...p } : x)),
    })),
  deletePurchase: (id) =>
    set((s) => ({ purchases: s.purchases.filter((x) => x.id !== id) })),

  addVendorPayment: (p) => {
    const id = get().nextVendorPaymentId;
    set((s) => ({
      vendorPayments: [...s.vendorPayments, { ...p, id }],
      nextVendorPaymentId: id + 1n,
    }));
    return id;
  },

  addExpense: (e) => {
    const id = get().nextExpenseId;
    set((s) => ({
      expenses: [...s.expenses, { ...e, id }],
      nextExpenseId: id + 1n,
    }));
    return id;
  },
  updateExpense: (id, e) =>
    set((s) => ({
      expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...e } : x)),
    })),
  deleteExpense: (id) =>
    set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),

  updateClinicSettings: (s) =>
    set((st) => ({ clinicSettings: { ...st.clinicSettings, ...s } })),

  addUser: (u) => {
    const id = get().nextUserId;
    set((s) => ({ users: [...s.users, { ...u, id }], nextUserId: id + 1n }));
    return id;
  },
  updateUser: (id, u) =>
    set((s) => ({
      users: s.users.map((x) => (x.id === id ? { ...x, ...u } : x)),
    })),
  deleteUser: (id) =>
    set((s) => ({ users: s.users.filter((x) => x.id !== id) })),

  addMedicineCategory: (c) => {
    const id = get().nextCategoryId;
    set((s) => ({
      medicineCategories: [...s.medicineCategories, { ...c, id }],
      nextCategoryId: id + 1n,
    }));
    return id;
  },
  updateMedicineCategory: (id, c) =>
    set((s) => ({
      medicineCategories: s.medicineCategories.map((x) =>
        x.id === id ? { ...x, ...c } : x,
      ),
    })),
  deleteMedicineCategory: (id) =>
    set((s) => ({
      medicineCategories: s.medicineCategories.filter((x) => x.id !== id),
    })),

  addTemplate: (t) => {
    const id = `wt-${Date.now()}`;
    set((s) => ({ whatsappTemplates: [...s.whatsappTemplates, { ...t, id }] }));
  },
  updateTemplate: (id, t) =>
    set((s) => ({
      whatsappTemplates: s.whatsappTemplates.map((x) =>
        x.id === id ? { ...x, ...t } : x,
      ),
    })),
  deleteTemplate: (id) =>
    set((s) => ({
      whatsappTemplates: s.whatsappTemplates.filter((x) => x.id !== id),
    })),
  addLog: (l) => {
    set((s) => {
      const id = `wl-${s.nextWaLogId}`;
      return {
        whatsappLogs: [...s.whatsappLogs, { ...l, id }],
        nextWaLogId: s.nextWaLogId + 1,
      };
    });
  },
}));
