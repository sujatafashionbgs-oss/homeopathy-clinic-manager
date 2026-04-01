import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMockStore } from "./mockData";

export interface AuthUser {
  name: string;
  email: string;
  role: "Admin" | "Receptionist";
}

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => {
        const users = useMockStore.getState().users;
        const found = users.find(
          (u) => u.email === email && u.password === password && u.isActive,
        );
        if (found) {
          set({
            user: { name: found.name, email: found.email, role: found.role },
          });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null }),
    }),
    { name: "clinic-auth" },
  ),
);
