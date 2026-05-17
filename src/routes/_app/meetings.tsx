import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Clock } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList, useInsert, useUpdate, useDelete } from "@/lib/hooks/useTable";
import { useAuthStore } from "@/lib/stores/auth";
import { getBranch, isBranchAdmin, STAFF_ROLE_LABELS } from "@/lib/discord";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/meetings")({ component: MeetingsPage });

function MeetingsPage() {
  const { role } = useAuthStore();
  const canEdit = isBranchAdmin(role ?? "");
  const branch = getBranch(role ?? "");

  const { data: allData = [] } = useList<any>("meetings", { col: "date", asc: false });
  const data = role === "admin"
    ? allData
    : allData.filter((m) => m.branch === branch || m.branch === null);

  const ins = useInsert("meetings");
  const upd = useUpdate("meetings");
  const del = useDelete("meetings");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("17:00");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const [confirmDelId, setConfirmDelId] = useState<string | null>(null);

  const branchLabel = branch ? STAFF_ROLE_LABELS[branch] : "Все ветки";

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setEditDate(m.date);
    setEditTime(m.time ?? "");
  };

  const saveEdit = (id: string) => {
    upd.mutate(
      { id, patch: { date: editDate, time: editTime || null } },
      { onSuccess: () => { toast.success("Сохранено"); setEditingId(null); } }
    );
  };

  const deleteMeeting = (id: string) => {
    del.mutate(id, {
      onSuccess: () => { toast.success("Собрание удалено"); setConfirmDelId(null); },
      onError: (e: any) => toast.error("Ошибка: " + e.message),
    });
  };

  return (
    <div>
      <PageHeader title="Собрания" subtitle={`Ветка: ${branchLabel}`} />
      <div className="grid gap-5 md:grid-cols-2">

        {/* History list */}
        <GlassCard>
          <h2 className="mb-4 font-display text-2xl">История</h2>
          <div className="space-y-2">
            {data.map((m) => (
              <div key={m.id} className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm text-white">{m.title}</p>
                  {editingId === m.id ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="rounded bg-white/5 px-2 py-1 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="rounded bg-white/5 px-2 py-1 text-xs text-white focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-xs text-white/40">{new Date(m.date).toLocaleDateString("ru-RU")}</p>
                      {m.time && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="flex items-center gap-1 text-xs text-white/40">
                            <Clock className="h-3 w-3" />{m.time}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {editingId === m.id ? (
                      <>
                        <button onClick={() => saveEdit(m.id)} className="text-emerald-300 hover:text-emerald-200"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingId(null)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(m)} className="text-white/40 hover:text-white"><Pencil className="h-4 w-4" /></button>
                        {confirmDelId === m.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white/50">Удалить?</span>
                            <button onClick={() => deleteMeeting(m.id)} className="text-red-400 hover:text-red-300"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmDelId(null)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelId(m.id)} className="text-white/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {data.length === 0 && <p className="py-8 text-center text-sm text-white/30">Нет записей о собраниях</p>}
          </div>
        </GlassCard>

        {/* Create form */}
        {canEdit && (
          <GlassCard>
            <h2 className="mb-4 font-display text-2xl">Создать</h2>
            <div className="space-y-3">
              <input
                placeholder="Название собрания"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/40">Дата</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/40">Время</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (!date) return;
                  ins.mutate(
                    { date, time: time || null, title: title || "Собрание", branch: branch ?? null },
                    {
                      onSuccess: () => { setDate(""); setTitle(""); setTime("17:00"); toast.success("Собрание добавлено"); },
                      onError: (e: any) => toast.error("Ошибка: " + e.message),
                    }
                  );
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-sm font-medium text-black hover:bg-white/90"
              >
                <Plus className="h-4 w-4" /> Добавить собрание
              </button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
