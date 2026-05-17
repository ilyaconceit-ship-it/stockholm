import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/lib/stores/auth";
import { useList } from "@/lib/hooks/useTable";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, ShieldPlus, ShieldMinus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { getRoleLabel } from "@/components/layout/Topbar";
import { isBranchAdmin } from "@/lib/discord";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { role, username } = useAuthStore();
  const isAdmin = role === "admin";
  const canManageUsers = isBranchAdmin(role ?? "");
  const { data: profiles = [] } = useList<any>("profiles", { col: "created_at", asc: false });
  const { data: roles = [] } = useList<any>("user_roles");
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Можно загружать только изображения");
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Размер файла не должен превышать 5MB");
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

      toast.success("Аватарка обновлена");
      qc.invalidateQueries({ queryKey: ["profiles"] });
    } catch (error: any) {
      toast.error("Ошибка загрузки: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) {
      const errorMessages: Record<string, string> = {
        "Permission denied": "Доступ запрещен",
        "Not found": "Не найдено",
      };
      return toast.error(errorMessages[error.message] || error.message);
    }
    const statusText = status === "approved" ? "одобрен" : "отклонён";
    toast.success(`Пользователь ${statusText}`);
    qc.invalidateQueries({ queryKey: ["profiles"] });
  };

  const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
    if (makeAdmin) {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    } else {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    }
    qc.invalidateQueries({ queryKey: ["user_roles"] });
    toast.success("Роль обновлена");
  };

  return (
    <div>
      <PageHeader title="Настройки" subtitle="Управление профилем и доступом" />
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 font-display text-2xl">Ваш профиль</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-white/5 py-2"><span className="text-white/40">Имя пользователя</span><span>{username}</span></div>
            <div className="flex justify-between border-b border-white/5 py-2"><span className="text-white/40">Роль</span><span className="tracking-wide">{getRoleLabel(role)}</span></div>

            <div className="pt-4">
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">Аватарка</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white/70 transition-colors hover:bg-white/10">
                <Upload className="h-4 w-4" />
                <span>{uploading ? "Загрузка..." : "Загрузить новую аватарку"}</span>
                <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
              </label>
              <p className="mt-2 text-xs text-white/40">Максимум 5MB, форматы: JPG, PNG, GIF</p>
            </div>
          </div>
        </GlassCard>

        {canManageUsers && (
          <GlassCard>
            <h2 className="mb-4 font-display text-2xl">Запросы на регистрацию и роли</h2>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {profiles.map((p) => {
                const isAdminUser = roles.some((r) => r.user_id === p.id && r.role === "admin");
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                    <div>
                      <p className="text-sm text-white">{p.username}</p>
                      <p className="text-xs text-white/40">{p.discord_id ?? "—"} · <span className={p.status==="approved"?"text-emerald-300":p.status==="rejected"?"text-red-300":"text-amber-300"}>{p.status === "approved" ? "одобрен" : p.status === "rejected" ? "отклонён" : "ожидает"}</span></p>
                    </div>
                    <div className="flex gap-1">
                      {p.status !== "approved" && <button onClick={()=>setStatus(p.id,"approved")} title="Одобрить" className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-300 hover:bg-emerald-500/20"><Check className="h-4 w-4"/></button>}
                      {p.status !== "rejected" && <button onClick={()=>setStatus(p.id,"rejected")} title="Отклонить" className="rounded-md bg-red-500/10 p-1.5 text-red-300 hover:bg-red-500/20"><X className="h-4 w-4"/></button>}
                      <button onClick={()=>toggleAdmin(p.id,!isAdminUser)} title={isAdminUser?"Забрать админа":"Выдать админа"} className="rounded-md bg-white/5 p-1.5 text-white/70 hover:bg-white/10">
                        {isAdminUser ? <ShieldMinus className="h-4 w-4"/> : <ShieldPlus className="h-4 w-4"/>}
                      </button>
                    </div>
                  </div>
                );
              })}
              {profiles.length === 0 && <p className="py-8 text-center text-sm text-white/30">Нет пользователей</p>}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
