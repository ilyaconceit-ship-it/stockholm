import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { StaffRole, BranchAdminRole } from "@/lib/discord";

type Status = "pending" | "approved" | "rejected";

// All possible app roles
export type AppRole = "admin" | StaffRole | BranchAdminRole;

interface AuthState {
  user: User | null;
  status: Status | null;
  /** Currently active role */
  role: AppRole | null;
  /** All roles this user has (for branch switching) */
  allRoles: AppRole[];
  username: string | null;
  loading: boolean;
  set: (s: Partial<AuthState>) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: null,
  role: null,
  allRoles: [],
  username: null,
  loading: true,
  set: (s) => set(s),
  reset: () =>
    set({ user: null, status: null, role: null, allRoles: [], username: null, loading: false }),
}));
