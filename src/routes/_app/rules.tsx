import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/stores/auth";
import { getBranch, isBranchAdmin, STAFF_ROLE_LABELS } from "@/lib/discord";
import { useList, useInsert, useUpdate, useDelete } from "@/lib/hooks/useTable";
import { BookOpen, Plus, Pencil, Trash2, X, Check, GripVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/rules")({ component: RulesPage });

type Rule = {
  id: string;
  branch: string;
  title: string;
  description: string;
  display_order: number;
};

function RuleCard({
  rule,
  isAdmin,
  onEdit,
  onDelete
}: {
  rule: Rule;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <GlassCard>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="mb-4 font-display text-2xl text-white">{rule.title}</h2>
            <div className="whitespace-pre-wrap rounded-lg bg-white/[0.02] p-4 text-sm text-white/70">
              {rule.description}
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="rounded-md p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { onDelete(); setConfirmDelete(false); }}
                    className="rounded-md p-2 text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-md p-2 text-white/40 transition-colors hover:bg-white/5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-md p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function RuleEditor({
  rule,
  branch,
  onSave,
  onCancel,
}: {
  rule?: Rule;
  branch: string;
  onSave: (data: Partial<Rule>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(rule?.title || "");
  const [description, setDescription] = useState(rule?.description || "");

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    onSave({ title, description, branch });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <GlassCard>
        <h3 className="mb-4 font-display text-xl text-white">
          {rule ? "Редактировать раздел" : "Новый раздел"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/60">Название</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Правила трибуны"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание правил..."
              rows={8}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/5"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-white px-4 py-2 text-sm text-black transition-colors hover:bg-white/90"
            >
              Сохранить
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function RulesPage() {
  const { role } = useAuthStore();
  const branch = getBranch(role ?? "");
  const isAdmin = isBranchAdmin(role ?? "");

  const { data: rules = [] } = useList<Rule>("branch_rules", { col: "display_order", asc: true });
  const ins = useInsert("branch_rules");
  const upd = useUpdate("branch_rules");
  const del = useDelete("branch_rules");

  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const branchRules = rules.filter((r) => r.branch === branch);
  const branchLabel = branch ? STAFF_ROLE_LABELS[branch] : "вашей ветки";

  const handleSave = (ruleId: string | null, data: Partial<Rule>) => {
    if (ruleId) {
      upd.mutate(
        { id: ruleId, patch: data },
        {
          onSuccess: () => {
            toast.success("Сохранено");
            setEditing(null);
          },
        }
      );
    } else {
      ins.mutate(
        { ...data, display_order: branchRules.length },
        {
          onSuccess: () => {
            toast.success("Добавлено");
            setAdding(false);
          },
        }
      );
    }
  };

  const handleDelete = (ruleId: string) => {
    del.mutate(ruleId, {
      onSuccess: () => toast.success("Удалено"),
      onError: (e: any) => toast.error("Ошибка: " + e.message),
    });
  };

  return (
    <div>
      <PageHeader title="Памятка" subtitle={`Правила ветки ${branchLabel}`} />

      <div className="space-y-6">
        {isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Добавить раздел
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {adding && (
            <RuleEditor
              branch={branch!}
              onSave={(data) => handleSave(null, data)}
              onCancel={() => setAdding(false)}
            />
          )}

          {branchRules.map((rule) =>
            editing === rule.id ? (
              <RuleEditor
                key={rule.id}
                rule={rule}
                branch={branch!}
                onSave={(data) => handleSave(rule.id, data)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <RuleCard
                key={rule.id}
                rule={rule}
                isAdmin={isAdmin}
                onEdit={() => setEditing(rule.id)}
                onDelete={() => handleDelete(rule.id)}
              />
            )
          )}
        </AnimatePresence>

        {branchRules.length === 0 && !adding && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard>
              <div className="flex flex-col items-center py-16 text-center">
                <BookOpen className="mb-4 h-10 w-10 text-white/20" />
                <p className="text-white/50">Памятка для ветки {branchLabel} пока не заполнена</p>
                {isAdmin && (
                  <p className="mt-2 text-xs text-white/30">Нажмите "Добавить раздел" чтобы начать</p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
