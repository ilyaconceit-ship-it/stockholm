import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/lib/stores/auth";
import { useList } from "@/lib/hooks/useTable";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Ban, Trash2, UserX, RefreshCw, Database } from "lucide-react";
import { getBranch, isBranchAdmin, STAFF_ROLE_LABELS } from "@/lib/discord";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({ component: AdminPage });

function AdminPage() {
  const { role } = useAuthStore();
  const hasAdminAccess = isBranchAdmin(role ?? "");
  const isSuperAdmin = role === "admin";
  const branch = getBranch(role ?? "");

  const { data: profiles = [] } = useList<any>("profiles", { col: "created_at", asc: false });
  const { data: roles = [] } = useList<any>("user_roles");
  const { data: allStaff = [] } = useList<any>("staff_members");
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  if (!hasAdminAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-white/20" />
          <p className="text-white/40">Доступ запрещен</p>
        </div>
      </div>
    );
  }

  // Filter staff to current branch (super admin sees all)
  const staff = isSuperAdmin
    ? allStaff
    : allStaff.filter((s) => s.category === branch);

  // Filter approved users to those in this branch
  const approvedUsers = profiles.filter((p) => {
    if (p.status !== "approved") return false;
    if (isSuperAdmin) return true;
    // Match users whose role in user_roles matches this branch
    const userRole = roles.find((r) => r.user_id === p.id);
    if (!userRole) return false;
    const userBranch = getBranch(userRole.role);
    return userBranch === branch;
  });

  const staffWithWarnings = staff.filter(
    (s) => s.warnings && s.warnings !== "0" && s.warnings !== "-"
  );

  const branchLabel = branch ? STAFF_ROLE_LABELS[branch] : "Все ветки";

  const revokeAccess = async (userId: string, username: string) => {
    if (!confirm(`Забрать доступ у ${username}?`)) return;
    setLoading(true);
    try {
      const profile = profiles.find((p) => p.id === userId);
      if (profile?.discord_id) {
        await supabase.from("staff_members").delete().eq("discord_id", profile.discord_id);
      }
      await supabase.from("profiles").update({ status: "rejected" }).eq("id", userId);
      await supabase.from("user_roles").delete().eq("user_id", userId);
      toast.success(`Доступ у ${username} отозван`);
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["staff_members"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
    } catch (error: any) {
      toast.error("Ошибка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`УДАЛИТЬ пользователя ${username}? Это действие необратимо!`)) return;
    setLoading(true);
    try {
      const profile = profiles.find((p) => p.id === userId);
      if (profile?.discord_id) {
        await supabase.from("staff_members").delete().eq("discord_id", profile.discord_id);
      }
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);
      toast.success(`Пользователь ${username} удален`);
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["staff_members"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
    } catch (error: any) {
      toast.error("Ошибка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetWarnings = async (discordId: string, nickname: string) => {
    if (!confirm(`Сбросить предупреждения для ${nickname}?`)) return;
    setLoading(true);
    try {
      await supabase.from("staff_members").update({ warnings: "0" }).eq("discord_id", discordId);
      toast.success(`Предупреждения сброшены для ${nickname}`);
      qc.invalidateQueries({ queryKey: ["staff_members"] });
    } catch (error: any) {
      toast.error("Ошибка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Админ-панель"
        subtitle={isSuperAdmin ? "Управление всеми ветками" : `Управление веткой ${branchLabel}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <Shield className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{approvedUsers.length}</p>
              <p className="text-xs text-white/40">Активных пользователей</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <Ban className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{staffWithWarnings.length}</p>
              <p className="text-xs text-white/40">С предупреждениями</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Database className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{staff.length}</p>
              <p className="text-xs text-white/40">Всего в ветке</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 font-display text-2xl">Управление доступом</h2>
          <div className="max-h-[500px] space-y-2 overflow-y-auto">
            {approvedUsers.map((p) => {
              const userRoleRow = roles.find((r) => r.user_id === p.id);
              const userRoleLabel = userRoleRow
                ? (userRoleRow.role === "admin" ? "супер-админ" : userRoleRow.role)
                : "пользователь";
              const isAdminUser = userRoleRow?.role === "admin" || userRoleRow?.role?.startsWith("admin_");
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div>
                    <p className="text-sm text-white">{p.username}</p>
                    <p className="text-xs text-white/40">
                      {p.discord_id ?? "—"} ·{" "}
                      <span className={isAdminUser ? "text-purple-300" : "text-white/40"}>
                        {userRoleLabel}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => revokeAccess(p.id, p.username)}
                      disabled={loading}
                      className="rounded-md bg-amber-500/10 p-2 text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                      title="Забрать доступ"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(p.id, p.username)}
                      disabled={loading}
                      className="rounded-md bg-red-500/10 p-2 text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      title="Удалить пользователя"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {approvedUsers.length === 0 && (
              <p className="py-8 text-center text-sm text-white/30">Нет активных пользователей</p>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 font-display text-2xl">Предупреждения</h2>
          <div className="max-h-[500px] space-y-2 overflow-y-auto">
            {staffWithWarnings.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="text-sm text-white">{s.nickname}</p>
                  <p className="text-xs text-white/40">
                    <span className="text-red-300">{s.warnings}/3 предупреждений</span>
                  </p>
                </div>
                <button
                  onClick={() => resetWarnings(s.discord_id, s.nickname)}
                  disabled={loading}
                  className="rounded-md bg-emerald-500/10 p-2 text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                  title="Сбросить предупреждения"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            ))}
            {staffWithWarnings.length === 0 && (
              <p className="py-8 text-center text-sm text-white/30">Нет пользователей с предупреждениями</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
