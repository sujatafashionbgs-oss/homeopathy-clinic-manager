import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HomeoMedicine {
  id: number;
  name: string;
  category: string;
  usage: string;
  potency: string;
  unit: string;
  company: string;
}

interface MedicineMasterState {
  medicines: HomeoMedicine[];
  initialized: boolean;
  setMedicines: (medicines: HomeoMedicine[]) => void;
  addMedicines: (newMeds: HomeoMedicine[]) => void;
  initializeIfEmpty: (defaultMeds: HomeoMedicine[]) => void;
}

export const useMedicineMasterStore = create<MedicineMasterState>()(
  persist(
    (set, get) => ({
      medicines: [],
      initialized: false,
      setMedicines: (medicines) => set({ medicines }),
      addMedicines: (newMeds) =>
        set((state) => ({
          medicines: [
            ...state.medicines,
            ...newMeds.map((m, i) => ({
              ...m,
              id: state.medicines.length + i + 1,
            })),
          ],
        })),
      initializeIfEmpty: (defaultMeds) => {
        if (!get().initialized) {
          set({ medicines: defaultMeds, initialized: true });
        }
      },
    }),
    { name: "medicineMasterStore" },
  ),
);
