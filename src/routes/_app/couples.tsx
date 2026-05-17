import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2 } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList, useInsert, useDelete } from "@/lib/hooks/useTable";
import { useAuthStore } from "@/lib/stores/auth";
import { getBranch, isBranchAdmin, STAFF_ROLE_LABELS } from "@/lib/discord";

export const Route = createFileRoute("/_app/couples")({ component: CouplesPage });

function CouplesPage() {
  const { role } = useAuthStore();
  const canEdit = isBranchAdmin(role ?? "");
  const branch = getBranch(role ?? "");

  const { data: allData = [] } = useList<any>("couples", { col: "created_at", asc: false });
  const data = role === "admin"
    ? allData
    : allData.filter((c) => c.branch === branch || c.branch === null);

  const ins = useInsert("couples");
  const del = useDelete("couples");
  const [draft, setDraft] = useState({
    member1_nickname: "", member1_discord_id: "",
    member2_nickname: "", member2_discord_id: "", notes: "",
  });

  const branchLabel = branch ? STAFF_ROLE_LABELS[branch] : "Все ветки";

  return (
    <div>
      <PageHeader title="Парочки" subtitle={branchLabel} />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {data.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
            <GlassCard>
              <div className="flex items-start justify-between">
                <Heart className="h-5 w-5 text-white/40" />
                {canEdit && (
                  <button onClick={() => del.mutate(c.id)} className="text-white/30 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <p className="font-display text-xl text-white">{c.member1_nickname}</p>
                <p className="text-xs text-white/40">&amp;</p>
                <p className="font-display text-xl text-white">{c.member2_nickname}</p>
              </div>
              {c.notes && <p className="mt-3 text-xs italic text-white/50">"{c.notes}"</p>}
            </GlassCard>
          </motion.div>
        ))}

        {canEdit && (
          <GlassCard>
            <h3 className="mb-3 font-display text-xl">Новая пара</h3>
            <div className="space-y-2">
              <input placeholder="Ник участника 1" value={draft.member1_nickname} onChange={(e) => setDraft({ ...draft, member1_nickname: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none" />
              <input placeholder="Discord ID участника 1" value={draft.member1_discord_id} onChange={(e) => setDraft({ ...draft, member1_discord_id: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none" />
              <input placeholder="Ник участника 2" value={draft.member2_nickname} onChange={(e) => setDraft({ ...draft, member2_nickname: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none" />
              <input placeholder="Discord ID участника 2" value={draft.member2_discord_id} onChange={(e) => setDraft({ ...draft, member2_discord_id: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none" />
              <input placeholder="Заметки" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none" />
              <button
                onClick={() => {
                  if (!draft.member1_nickname || !draft.member2_nickname) return;
                  ins.mutate(
                    { ...draft, branch: branch ?? null },
                    { onSuccess: () => setDraft({ member1_nickname: "", member1_discord_id: "", member2_nickname: "", member2_discord_id: "", notes: "" }) }
                  );
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-sm font-medium text-black hover:bg-white/90"
              >
                <Plus className="h-4 w-4" /> Добавить
              </button>
            </div>
          </GlassCard>
        )}

        {data.length === 0 && !canEdit && (
          <p className="col-span-full py-12 text-center text-sm text-white/30">Пока нет пар</p>
        )}
      </div>
    </div>
  );
}
