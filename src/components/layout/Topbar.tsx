import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Shield, User, ChevronDown, Check } from "lucide-react";
import { useAuthStore, type AppRole } from "@/lib/stores/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { getBranch, isBranchAdmin, STAFF_ROLE_LABELS, STAFF_ROLE_LABELS_RU } from "@/lib/discord";
import { useState, useRef, useEffect } from "react";

// Human-readable role label in Russian
export function getRoleLabel(role: string | null): string {
  if (!role) return "";
  if (role === "admin") return "Администратор";
  if (isBranchAdmin(role)) return "Администратор";
  const branch = getBranch(role);
  if (!branch) return role;
  return STAFF_ROLE_LABELS_RU[branch];
}

// Short branch label for the switcher list
function getBranchLabel(role: AppRole): string {
  if (role === "admin") return "Супер-админ";
  const branch = getBranch(role);
  const branchName = branch ? STAFF_ROLE_LABELS[branch] : role;
  return isBranchAdmin(role) ? `${branchName} (Админ)` : branchName;
}

export function Topbar() {
  const { username, role, allRoles, set } = useAuthStore();
  const navigate = useNavigate();
  const isAnyAdmin = isBranchAdmin(role ?? "");
  const hasMultipleRoles = allRoles.length > 1;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const switchRole = (newRole: AppRole) => {
    set({ role: newRole });
    setOpen(false);
    // Navigate to dashboard so the new branch context loads cleanly
    navigate({ to: "/dashboard" });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-black/40 px-6 backdrop-blur-2xl"
    >
      {/* Left side — branch switcher (only if multiple roles) */}
      <div className="flex items-center gap-3">
        {hasMultipleRoles && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span>Переключить ветку</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-2xl"
                >
                  <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/30">
                    Ваши ветки
                  </div>
                  <div className="pb-2">
                    {allRoles.map((r) => {
                      const isActive = r === role;
                      return (
                        <button
                          key={r}
                          onClick={() => switchRole(r)}
                          className={`flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-white/50 hover:bg-white/[0.05] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isBranchAdmin(r) ? (
                              <Shield className="h-3.5 w-3.5 text-white/40" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-white/40" />
                            )}
                            <span>{getBranchLabel(r)}</span>
                          </div>
                          {isActive && <Check className="h-3.5 w-3.5 text-white/60" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Right side — user badge + logout */}
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:flex">
          {isAnyAdmin
            ? <Shield className="h-3.5 w-3.5 text-white" />
            : <User className="h-3.5 w-3.5 text-white/60" />
          }
          <span className="text-white/80">{username ?? "—"}</span>
          <span className="text-white/30">·</span>
          <span className="tracking-wide text-white/40">{getRoleLabel(role)}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Выйти</span>
        </button>
      </div>
    </motion.header>
  );
}
