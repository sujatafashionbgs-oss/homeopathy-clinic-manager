import {
  type Bill,
  type BillItem,
  type ClinicSettings,
  type Expense,
  type Medicine,
  type MedicineCategory,
  type Patient,
  type PaymentRecord,
  type PrescriptionItem,
  type Purchase,
  type PurchaseItem,
  type StockMovement,
  type User,
  type Vendor,
  type VendorPayment,
  type Visit,
  useMockStore,
} from "../store/mockData";
import { nowNanoseconds } from "../utils/formatters";

export type {
  Patient,
  Visit,
  Bill,
  BillItem,
  Medicine,
  Vendor,
  Purchase,
  PurchaseItem,
  VendorPayment,
  Expense,
  ClinicSettings,
  User,
  MedicineCategory,
  StockMovement,
  PaymentRecord,
  PrescriptionItem,
};

export const Gender = {
  male: "male" as const,
  female: "female" as const,
  other: "other" as const,
};
export const PaymentStatus = {
  pending: "pending" as const,
  paid: "paid" as const,
  partial: "partial" as const,
};

function useStoreValue<T>(
  selector: (s: ReturnType<typeof useMockStore.getState>) => T,
): T {
  return useMockStore(selector);
}

// ─── Patients ────────────────────────────────────────────────────────────────

export function useSearchPatients(term: string, activeOnly?: boolean) {
  const patients = useStoreValue((s) => s.patients);
  let data = term
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(term.toLowerCase()) ||
          p.patientCode.toLowerCase().includes(term.toLowerCase()) ||
          p.phone.includes(term) ||
          (p.city ?? "").toLowerCase().includes(term.toLowerCase()),
      )
    : patients;
  if (activeOnly !== undefined) {
    data = data.filter((p) => p.isActive === activeOnly);
  }
  return { data, isLoading: false };
}

export function usePatient(id: bigint | null) {
  const patients = useStoreValue((s) => s.patients);
  const data = id !== null ? (patients.find((p) => p.id === id) ?? null) : null;
  return { data, isLoading: false };
}

export function useAddPatient() {
  const store = useMockStore.getState;
  return {
    mutateAsync: async (
      p: Omit<Patient, "id" | "patientCode" | "isActive" | "createdAt">,
    ) => {
      return store().addPatient(p);
    },
    isPending: false,
  };
}

export function useUpdatePatient() {
  return {
    mutateAsync: async ({
      id,
      patient,
    }: { id: bigint; patient: Partial<Patient> }) => {
      useMockStore.getState().updatePatient(id, patient);
    },
    isPending: false,
  };
}

export function useDeletePatient() {
  return {
    mutateAsync: async (id: bigint) => {
      useMockStore.getState().deletePatient(id);
    },
    isPending: false,
  };
}

// ─── Visits ───────────────────────────────────────────────────────────────────

export function useAllVisits() {
  const data = useStoreValue((s) => s.visits);
  return { data, isLoading: false };
}

export function useVisitsByPatient(patientId: bigint | null) {
  const visits = useStoreValue((s) => s.visits);
  const data =
    patientId !== null ? visits.filter((v) => v.patientId === patientId) : [];
  return { data, isLoading: false };
}

export function useAddVisit() {
  return {
    mutateAsync: async (v: Omit<Visit, "id" | "isActive">) => {
      return useMockStore.getState().addVisit(v);
    },
    isPending: false,
  };
}

export function useUpdateVisit() {
  return {
    mutateAsync: async ({
      id,
      visit,
    }: { id: bigint; visit: Partial<Visit> }) => {
      useMockStore.getState().updateVisit(id, visit);
    },
    isPending: false,
  };
}

export function useDeleteVisit() {
  return {
    mutateAsync: async (id: bigint) => {
      useMockStore.getState().deleteVisit(id);
    },
    isPending: false,
  };
}

// ─── Bills ────────────────────────────────────────────────────────────────────

export function useAllBills(_patients?: Patient[]) {
  const data = useStoreValue((s) => s.bills);
  return { data, isLoading: false };
}

export function useBillsByPatient(patientId: bigint | null) {
  const bills = useStoreValue((s) => s.bills);
  const data =
    patientId !== null ? bills.filter((b) => b.patientId === patientId) : [];
  return { data, isLoading: false };
}

export function useAddBill() {
  return {
    mutateAsync: async (b: Omit<Bill, "id" | "billNumber" | "isActive">) => {
      return useMockStore.getState().addBill(b);
    },
    isPending: false,
  };
}

export function useUpdateBill() {
  return {
    mutateAsync: async ({ id, bill }: { id: bigint; bill: Partial<Bill> }) => {
      useMockStore.getState().updateBill(id, bill);
    },
    isPending: false,
  };
}

export function useDeleteBill() {
  return {
    mutateAsync: async (id: bigint) => {
      useMockStore.getState().deleteBill(id);
    },
    isPending: false,
  };
}

export function useAddBillPayment() {
  return {
    mutateAsync: async ({
      billId,
      payment,
    }: { billId: bigint; payment: PaymentRecord }) => {
      useMockStore.getState().addBillPayment(billId, payment);
    },
    isPending: false,
  };
}

// ─── Medicines ────────────────────────────────────────────────────────────────

export function useAllMedicines() {
  const data = useStoreValue((s) => s.medicines);
  return { data, isLoading: false };
}

export function useLowStockMedicines() {
  const medicines = useStoreValue((s) => s.medicines);
  const data = medicines.filter((m) => m.quantity <= m.minStockLevel);
  return { data, isLoading: false };
}

export function useAddMedicine() {
  return {
    mutateAsync: async (m: Omit<Medicine, "id" | "isActive">) => {
      return useMockStore.getState().addMedicine(m);
    },
    isPending: false,
  };
}

export function useUpdateMedicine() {
  return {
    mutateAsync: async ({
      id,
      medicine,
    }: { id: bigint; medicine: Partial<Medicine> }) => {
      useMockStore.getState().updateMedicine(id, medicine);
    },
    isPending: false,
  };
}

export function useDeleteMedicine() {
  return {
    mutateAsync: async (id: bigint) => {
      useMockStore.getState().deleteMedicine(id);
    },
    isPending: false,
  };
}

export function useAdjustStock() {
  return {
    mutate: (id: bigint, delta: number) => {
      useMockStore.getState().adjustStock(id, delta);
    },
  };
}

// ─── Stock Movements ─────────────────────────────────────────────────────────

export function useStockMovements(medicineId?: bigint) {
  const movements = useStoreValue((s) => s.stockMovements);
  const data =
    medicineId !== undefined
      ? movements.filter((m) => m.medicineId === medicineId)
      : movements;
  return { data, isLoading: false };
}

export function useAddStockMovement() {
  return {
    mutateAsync: async (m: Omit<StockMovement, "id">) => {
      return useMockStore.getState().addStockMovement(m);
    },
    isPending: false,
  };
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export function useVendors() {
  const data = useStoreValue((s) => s.vendors);
  return { data, isLoading: false };
}

export function useAddVendor() {
  return {
    mutateAsync: async (v: Omit<Vendor, "id" | "isActive">) => {
      return useMockStore.getState().addVendor(v);
    },
    isPending: false,
  };
}

export function useUpdateVendor() {
  return {
    mutateAsync: async ({
      id,
      vendor,
    }: { id: bigint; vendor: Partial<Vendor> }) => {
      useMockStore.getState().updateVendor(id, vendor);
    },
    isPending: false,
  };
}

export function useDeleteVendor() {
  return {
    mutateAsync: async (id: bigint) => {
      useMockStore.getState().deleteVendor(id);
    },
    isPending: false,
  };
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export function usePurchases() {
  const data = useStoreValue((s) => s.purchases);
  return { data, isLoading: false };
}

export function useAddPurchase() {
  return {
    mutateAsync: async (p: Omit<Purchase, "id" | "isActive">) => {
      return useMockStore.getState().addPurchase(p);
    },
    isPending: false,
  };
}

export function useUpdatePurchase() {
  return {
    mutateAsync: async ({
      id,
      purchase,
    }: { id: bigint; purchase: Partial<Purchase> }) => {
      useMockStore.getState().updatePurchase(id, purchase);
    },
    isPending: false,
  };
}

export function useDeletePurchase() {
  return {
    mutateAsync: async (id: bigint) => {
      useMockStore.getState().deletePurchase(id);
    },
    isPending: false,
  };
}

// ─── Vendor Payments ──────────────────────────────────────────────────────────

export function useVendorPayments() {
  const data = useStoreValue((s) => s.vendorPayments);
  return { data, isLoading: false };
}

export function useAddVendorPayment() {
  return {
    mutateAsync: async (p: Omit<VendorPayment, "id">) => {
      return useMockStore.getState().addVendorPayment(p);
    },
    isPending: false,
  };
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export function useExpenses() {
  const data = useStoreValue((s) => s.expenses);
  return { data, isLoading: false };
}

export function useAddExpense() {
  return {
    mutateAsync: async (e: Omit<Expense, "id">) => {
      return useMockStore.getState().addExpense(e);
    },
    isPending: false,
  };
}

export function useUpdateExpense() {
  return {
    mutateAsync: async ({
      id,
      expense,
    }: { id: bigint; expense: Partial<Expense> }) => {
      useMockStore.getState().updateExpense(id, expense);
    },
    isPending: false,
  };
}

export function useDeleteExpense() {
  return {
    mutateAsync: async (id: bigint) => {
      useMockStore.getState().deleteExpense(id);
    },
    isPending: false,
  };
}

// ─── Clinic Settings ──────────────────────────────────────────────────────────

export function useClinicSettings() {
  const data = useStoreValue((s) => s.clinicSettings);
  return { data, isLoading: false };
}

export function useUpdateClinicSettings() {
  return {
    mutateAsync: async (s: Partial<ClinicSettings>) => {
      useMockStore.getState().updateClinicSettings(s);
    },
    isPending: false,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useUsers() {
  const data = useStoreValue((s) => s.users);
  return { data, isLoading: false };
}

export function useAddUser() {
  return {
    mutateAsync: async (u: Omit<User, "id">) => {
      return useMockStore.getState().addUser(u);
    },
    isPending: false,
  };
}

export function useUpdateUser() {
  return {
    mutateAsync: async ({ id, user }: { id: bigint; user: Partial<User> }) => {
      useMockStore.getState().updateUser(id, user);
    },
    isPending: false,
  };
}

export function useDeleteUser() {
  return {
    mutateAsync: async (id: bigint) => {
      useMockStore.getState().deleteUser(id);
    },
    isPending: false,
  };
}

// ─── Medicine Categories ─────────────────────────────────────────────────────

export function useMedicineCategories() {
  const data = useStoreValue((s) => s.medicineCategories);
  return { data, isLoading: false };
}

export function useAddMedicineCategory() {
  return {
    mutateAsync: async (c: Omit<MedicineCategory, "id">) => {
      return useMockStore.getState().addMedicineCategory(c);
    },
    isPending: false,
  };
}

export function useUpdateMedicineCategory() {
  return {
    mutateAsync: async ({
      id,
      category,
    }: { id: bigint; category: Partial<MedicineCategory> }) => {
      useMockStore.getState().updateMedicineCategory(id, category);
    },
    isPending: false,
  };
}

export function useDeleteMedicineCategory() {
  return {
    mutateAsync: async (id: bigint) => {
      useMockStore.getState().deleteMedicineCategory(id);
    },
    isPending: false,
  };
}

export { nowNanoseconds };

// ─── WhatsApp Hooks ───────────────────────────────────────────────────────────

export function useWhatsAppStore() {
  const templates = useMockStore((s) => s.whatsappTemplates);
  const logs = useMockStore((s) => s.whatsappLogs);
  const addTemplate = useMockStore((s) => s.addTemplate);
  const updateTemplate = useMockStore((s) => s.updateTemplate);
  const deleteTemplate = useMockStore((s) => s.deleteTemplate);
  const addLog = useMockStore((s) => s.addLog);
  return {
    templates,
    logs,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addLog,
  };
}
