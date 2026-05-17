import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, X, Check, Copy } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList, useInsert, useUpdate, useDelete } from "@/lib/hooks/useTable";
import { useAuthStore } from "@/lib/stores/auth";
import { getBranch, isBranchAdmin } from "@/lib/discord";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/staff")({ component: StaffPage });

// Broadcaster branch categories (original)
const CATEGORY_LABELS: Record<string, string> = {
  admin_branch: "Админ ветки",
  curator: "Кураторы",
  tech_curator: "Тех кураторы",
  master: "Мастера",
  broadcaster: "Бродкастеры",
};

const CATEGORIES = ["admin_branch", "curator", "tech_curator", "master", "broadcaster"] as const;

type Member = {
  id: string; nickname: string; discord_id: string | null; name: string | null;
  category: string; join_date: string; warnings: string | null; vacation: boolean; active: boolean;
  avatar: string | null; gender: string | null;
};

function StaffRow({ m, isAdmin, onSave, onDel, index }: { m: Member; isAdmin: boolean; onSave: (patch: any) => void; onDel: () => void; index: number }) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(m);
  const [confirmDel, setConfirmDel] = useState(false);
  const days = Math.floor((Date.now() - new Date(m.join_date).getTime()) / 86400000);

  const avatarUrl = m.avatar && m.discord_id
    ? `https://cdn.discordapp.com/avatars/${m.discord_id}/${m.avatar}.png?size=128`
    : "/logo.png";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} скопирован`);
  };

  return (
    <tr className="group border-b border-white/5 transition-colors hover:bg-white/[0.03]">
      <td className="px-4 py-3 text-center text-sm text-white/40">{index + 1}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
          {edit ? (
            <input value={draft.nickname} onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} className="w-full bg-transparent focus:outline-none" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white">{m.nickname}</span>
              {isAdmin && (
                <button onClick={() => copyToClipboard(m.nickname, "Никнейм")} className="opacity-0 transition-opacity group-hover:opacity-100 text-white/40 hover:text-white">
                  <Copy className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-white/50">
        {edit ? (
          <input value={draft.discord_id ?? ""} onChange={(e) => setDraft({ ...draft, discord_id: e.target.value })} className="w-full bg-transparent focus:outline-none" />
        ) : (
          <div className="flex items-center gap-2">
            <span>&lt;@{m.discord_id}&gt;</span>
            {isAdmin && m.discord_id && (
              <button onClick={() => copyToClipboard(m.discord_id!, "Discord ID")} className="opacity-0 transition-opacity group-hover:opacity-100 text-white/40 hover:text-white">
                <Copy className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-white/60">
        {edit ? <input type="date" value={draft.join_date} onChange={(e) => setDraft({ ...draft, join_date: e.target.value })} className="w-full bg-transparent focus:outline-none" /> : new Date(m.join_date).toLocaleDateString("ru-RU")}
      </td>
      <td className="px-4 py-3 text-center text-sm text-white/80">{days}</td>
      <td className="px-4 py-3 text-center">
        {edit ? (
          <input value={draft.warnings ?? ""} onChange={(e) => setDraft({ ...draft, warnings: e.target.value })} className="w-16 bg-transparent text-center focus:outline-none" placeholder="0" />
        ) : (
          <span className={`rounded-md px-2 py-0.5 text-xs ${m.warnings && m.warnings !== "-" && m.warnings !== "0" ? "bg-red-500/10 text-red-300" : "text-white/40"}`}>
            {m.warnings && m.warnings !== "-" ? `${m.warnings}/3` : "0/3"}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-xs">
        <span className={`rounded-md px-2 py-0.5 ${m.vacation ? "bg-amber-500/10 text-amber-300" : "text-white/30"}`}>{m.vacation ? "отпуск" : "активен"}</span>
      </td>
      {isAdmin && (
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            {edit ? (
              <>
                <button onClick={() => { onSave(draft); setEdit(false); }} className="text-emerald-300 hover:text-emerald-200"><Check className="h-4 w-4" /></button>
                <button onClick={() => { setDraft(m); setEdit(false); }} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
              </>
            ) : confirmDel ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50">Удалить?</span>
                <button onClick={() => { onDel(); setConfirmDel(false); }} className="text-red-400 hover:text-red-300"><Check className="h-4 w-4" /></button>
                <button onClick={() => setConfirmDel(false)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                <select
                  value={m.category === "broadcaster" && m.gender ? `broadcaster_${m.gender}` : m.category}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "broadcaster_male") {
                      onSave({ ...m, category: "broadcaster", gender: "male" });
                    } else if (value === "broadcaster_female") {
                      onSave({ ...m, category: "broadcaster", gender: "female" });
                    } else {
                      onSave({ ...m, category: value, gender: null });
                    }
                  }}
                  className="cursor-pointer rounded-md bg-white/[0.03] px-2 py-1 text-xs text-white/70 transition-colors hover:bg-white/[0.06] focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                  style={{ colorScheme: "dark" }}
                >
                  {CATEGORIES.map((cat) => {
                    if (cat === "broadcaster") {
                      return [
                        <option key="broadcaster_male" value="broadcaster_male" style={{ backgroundColor: "#0a0a0a" }}>Бродкастеры (М)</option>,
                        <option key="broadcaster_female" value="broadcaster_female" style={{ backgroundColor: "#0a0a0a" }}>Бродкастеры (Ж)</option>,
                      ];
                    }
                    return <option key={cat} value={cat} style={{ backgroundColor: "#0a0a0a" }}>{CATEGORY_LABELS[cat]}</option>;
                  })}
                </select>
                <button onClick={() => setEdit(true)} className="text-white/40 hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setConfirmDel(true)} className="text-white/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

function StaffPage() {
  const { role } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = role === "admin" || role === "admin_broadcaster";
  const branch = getBranch(role ?? "");
  // Broadcaster branch = broadcaster or any admin of broadcaster branch
  const isBroadcasterBranch = role === "admin" || branch === "broadcaster";

  // Redirect non-broadcaster roles to their own staff page
  useEffect(() => {
    if (!role) return;
    if (isBroadcasterBranch) return;
    // Use branch to build the correct route (handles admin_support → /support-staff etc.)
    if (branch) {
      navigate({ to: `/${branch}-staff` as any });
    }
  }, [role, branch, isBroadcasterBranch, navigate]);

  const { data: staff = [] } = useList<Member>("staff_members", { col: "join_date", asc: true });
  const ins = useInsert("staff_members");
  const upd = useUpdate("staff_members");
  const del = useDelete("staff_members");
  const [adding, setAdding] = useState<string | null>(null);
  const [newRow, setNewRow] = useState({ nickname: "", discord_id: "" });

  const grouped = CATEGORIES.map((cat) => {
    const items = staff.filter((s) => s.category === cat);

    // For broadcasters, split by gender
    if (cat === "broadcaster") {
      const males = items.filter((s) => s.gender === "male");
      const females = items.filter((s) => s.gender === "female");
      const unknown = items.filter((s) => !s.gender);

      return [
        { cat: "broadcaster_male" as const, label: "Бродкастеры (М)", items: males },
        { cat: "broadcaster_female" as const, label: "Бродкастеры (Ж)", items: females },
        ...(unknown.length > 0 ? [{ cat: "broadcaster" as const, label: "Бродкастеры", items: unknown }] : []),
      ];
    }

    return [{ cat, label: CATEGORY_LABELS[cat], items }];
  }).flat();

  if (!isBroadcasterBranch) return null;

  return (
    <div>
      <PageHeader title="Ветка" subtitle="Реестр персонала Broadcaster" />
      <div className="space-y-6">
        {grouped.map(({ cat, label, items }, idx) => (
          <motion.div key={`${cat}-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <GlassCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl text-white/90">{label}</h2>
                {isAdmin && (
                  <button onClick={() => setAdding(adding === cat ? null : cat)} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
                    <Plus className="h-3.5 w-3.5" /> Добавить
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                      <th className="px-4 py-2 text-center font-normal">#</th>
                      <th className="px-4 py-2 font-normal">Ник</th>
                      <th className="px-4 py-2 font-normal">Discord ID</th>
                      <th className="px-4 py-2 font-normal">Вступил</th>
                      <th className="px-4 py-2 text-center font-normal">Дней</th>
                      <th className="px-4 py-2 text-center font-normal">Предупреждения</th>
                      <th className="px-4 py-2 text-center font-normal">Статус</th>
                      {isAdmin && <th className="px-4 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((m, idx) => (
                      <StaffRow key={m.id} m={m} isAdmin={isAdmin} index={idx}
                        onSave={(patch) => upd.mutate({ id: m.id, patch }, { onSuccess: () => toast.success("Сохранено") })}
                        onDel={() => del.mutate(m.id, { onSuccess: () => toast.success("Удалено"), onError: (e: any) => toast.error("Ошибка: " + e.message) })}
                      />
                    ))}
                    {adding === cat && (
                      <tr className="border-b border-white/5 bg-white/[0.04]">
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3"><input autoFocus placeholder="nickname" value={newRow.nickname} onChange={(e) => setNewRow({ ...newRow, nickname: e.target.value })} className="w-full bg-transparent text-white focus:outline-none" /></td>
                        <td className="px-4 py-3"><input placeholder="discord id" value={newRow.discord_id} onChange={(e) => setNewRow({ ...newRow, discord_id: e.target.value })} className="w-full bg-transparent text-xs text-white/70 focus:outline-none" /></td>
                        <td colSpan={4}></td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => {
                            if (!newRow.nickname) return;
                            const actualCategory = cat === "broadcaster_male" || cat === "broadcaster_female" ? "broadcaster" : cat;
                            const gender = cat === "broadcaster_male" ? "male" : cat === "broadcaster_female" ? "female" : null;
                            ins.mutate({ ...newRow, category: actualCategory, gender }, { onSuccess: () => { setNewRow({ nickname: "", discord_id: "" }); setAdding(null); toast.success("Добавлено"); } });
                          }} className="text-emerald-300 hover:text-emerald-200"><Check className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    )}
                    {items.length === 0 && adding !== cat && (
                      <tr><td colSpan={isAdmin ? 8 : 7} className="py-6 text-center text-sm text-white/30">Нет участников</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
