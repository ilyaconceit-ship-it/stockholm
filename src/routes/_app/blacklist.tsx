import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Ban } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList, useInsert, useDelete } from "@/lib/hooks/useTable";
import { useAuthStore } from "@/lib/stores/auth";
import { getBranch, isBranchAdmin, STAFF_ROLE_LABELS } from "@/lib/discord";

export const Route = createFileRoute("/_app/blacklist")({ component: BlacklistPage });

function BlacklistPage() {
  const { role } = useAuthStore();
  const canEdit = isBranchAdmin(role ?? "");
  const branch = getBranch(role ?? "");

  const { data: allData = [] } = useList<any>("blacklist", { col: "date", asc: false });
  const data = role === "admin"
    ? allData
    : allData.filter((b) => b.branch === branch || b.branch === null);

  const ins = useInsert("blacklist");
  const del = useDelete("blacklist");
  const [draft, setDraft] = useState({
    nickname: "", reason: "", admin_name: "", duration: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const branchLabel = branch ? STAFF_ROLE_LABELS[branch] : "Все ветки";

  return (
    <div>
      <PageHeader title="Чёрный список" subtitle={`ЧС ветки ${branchLabel}`} />
      <GlassCard>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="px-4 py-2 text-left font-normal">Ник</th>
              <th className="px-4 py-2 text-left font-normal">Причина</th>
              <th className="px-4 py-2 text-left font-normal">Админ</th>
              <th className="px-4 py-2 text-left font-normal">Дата</th>
              <th className="px-4 py-2 text-left font-normal">Срок</th>
              <th className="px-4 py-2 text-center font-normal">Статус</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-white">{b.nickname}</td>
                <td className="px-4 py-3 text-white/70">{b.reason}</td>
                <td className="px-4 py-3 text-white/60">{b.admin_name}</td>
                <td className="px-4 py-3 text-xs text-white/50">{new Date(b.date).toLocaleDateString("ru-RU")}</td>
                <td className="px-4 py-3 text-white/60">{b.duration}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-md px-2 py-0.5 text-xs ${b.status === "active" ? "bg-red-500/10 text-red-300" : "bg-white/5 text-white/40"}`}>
                    {b.status}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <button onClick={() => del.mutate(b.id)} className="text-white/40 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {canEdit && (
              <tr className="bg-white/[0.03]">
                <td className="px-2 py-2"><input type="text" placeholder="Ник" value={draft.nickname} onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                <td className="px-2 py-2"><input type="text" placeholder="Причина" value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                <td className="px-2 py-2"><input type="text" placeholder="Админ" value={draft.admin_name} onChange={(e) => setDraft({ ...draft, admin_name: e.target.value })} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                <td className="px-2 py-2"><input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                <td className="px-2 py-2"><input type="text" placeholder="Срок" value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                <td colSpan={2} className="px-2">
                  <button
                    onClick={() => {
                      if (!draft.nickname) return;
                      ins.mutate(
                        { ...draft, branch: branch ?? null },
                        { onSuccess: () => setDraft({ nickname: "", reason: "", admin_name: "", duration: "", date: new Date().toISOString().slice(0, 10) }) }
                      );
                    }}
                    className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                  >
                    <Plus className="h-3 w-3" /> Добавить
                  </button>
                </td>
              </tr>
            )}
            {data.length === 0 && !canEdit && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-white/30">
                  <Ban className="mx-auto mb-2 h-6 w-6 text-white/20" />
                  Список пуст
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
