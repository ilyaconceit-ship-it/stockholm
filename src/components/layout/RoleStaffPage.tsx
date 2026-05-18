import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, X, Check, Copy, Save } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList, useInsert, useUpdate, useDelete } from "@/lib/hooks/useTable";
import { useAuthStore } from "@/lib/stores/auth";
import { STAFF_ROLE_LABELS, type StaffRole } from "@/lib/discord";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Member = {
  id: string; nickname: string; discord_id: string | null; name: string | null;
  category: string; category_id: string | null; join_date: string; warnings: string | null; vacation: boolean; active: boolean;
  avatar: string | null; total_points: number | null; shift_id: number | null;
};

type Shift = {
  id: number;
  name: string;
};

type ShiftWeek = {
  id: number;
  shift_id: number;
  week_start: string;
  week_end: string;
};

type Attendance = {
  id?: string;
  shift_week_id: number;
  staff_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  extra_hours: number;
  vacation_days: number;
};

function MemberRow({ m, isAdmin, onSave, onDel, index, showPoints }: { m: Member; isAdmin: boolean; onSave: (patch: any) => void; onDel: () => void; index: number; showPoints?: boolean }) {
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
        {edit
          ? <input type="date" value={draft.join_date} onChange={(e) => setDraft({ ...draft, join_date: e.target.value })} className="w-full bg-transparent focus:outline-none" />
          : new Date(m.join_date).toLocaleDateString("ru-RU")}
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
        <span className={`rounded-md px-2 py-0.5 ${m.vacation ? "bg-amber-500/10 text-amber-300" : "text-white/30"}`}>
          {m.vacation ? "отпуск" : "активен"}
        </span>
      </td>
      {showPoints && (
        <td className="px-4 py-3 text-center">
          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-sm font-medium text-emerald-300">
            {m.total_points?.toFixed(1) ?? "0.0"}
          </span>
        </td>
      )}
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

type Category = {
  id: string;
  name: string;
  branch: string;
  display_order: number;
};

interface RoleStaffPageProps {
  staffRole: StaffRole;
}

export function RoleStaffPage({ staffRole }: RoleStaffPageProps) {
  const { role } = useAuthStore();
  // Branch admin of this branch OR super admin can edit
  const isAdmin = role === "admin" || role === `admin_${staffRole}`;
  const [adding, setAdding] = useState<string | null>(null);
  const [newRow, setNewRow] = useState({ nickname: "", discord_id: "" });

  const { data: allStaff = [] } = useList<Member>("staff_members", { col: "join_date", asc: true });
  const { data: categories = [] } = useList<Category>("staff_categories", { col: "display_order", asc: true });
  const { data: shifts = [] } = useList<Shift>("shifts", { col: "name", asc: true });

  // Filter categories for this branch and staff for this role
  const branchCategories = categories.filter((c) => c.branch === staffRole).sort((a, b) => a.display_order - b.display_order);
  const members = allStaff.filter((s) => s.category === staffRole);

  const ins = useInsert("staff_members");
  const upd = useUpdate("staff_members");
  const del = useDelete("staff_members");

  const label = STAFF_ROLE_LABELS[staffRole];

  // Group members by category_id
  const grouped = branchCategories.map((cat) => ({
    category: cat,
    members: members.filter((m) => m.category_id === cat.id),
  }));

  // Shifts section state (only for moderators)
  const [selectedShift, setSelectedShift] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState<ShiftWeek | null>(null);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Load week and attendance when shift is selected
  const loadShiftWeek = async (shiftId: number) => {
    setLoadingShifts(true);
    try {
      // Get or create current week
      const { data: weekId, error: weekError } = await supabase.rpc("create_new_week_for_shift", {
        p_shift_id: shiftId,
      });

      if (weekError) throw weekError;

      // Get week details
      const { data: weekData, error: weekDataError } = await supabase
        .from("shift_weeks")
        .select("*")
        .eq("id", weekId)
        .single();

      if (weekDataError) throw weekDataError;
      setCurrentWeek(weekData);

      // Load attendance
      const { data: attData, error: attError } = await supabase
        .from("shift_attendance")
        .select("*")
        .eq("shift_week_id", weekId);

      if (attError) throw attError;

      const attMap: Record<string, Attendance> = {};
      attData?.forEach((a) => {
        attMap[a.staff_id] = a;
      });
      setAttendance(attMap);
    } catch (error: any) {
      toast.error("Ошибка загрузки недели: " + error.message);
    } finally {
      setLoadingShifts(false);
    }
  };

  const handleShiftChange = (shiftId: number) => {
    setSelectedShift(shiftId);
    setCurrentWeek(null);
    setAttendance({});
    loadShiftWeek(shiftId);
  };

  const updateAttendance = (staffId: string, field: keyof Attendance, value: any) => {
    setAttendance((prev) => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {
          shift_week_id: currentWeek!.id,
          staff_id: staffId,
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          extra_hours: 0,
          vacation_days: 0,
        }),
        [field]: value,
      },
    }));
  };

  const saveAttendance = async (staffId: string) => {
    if (!currentWeek) return;

    const data = attendance[staffId];
    if (!data) return;

    try {
      const { error } = await supabase.from("shift_attendance").upsert(
        {
          shift_week_id: currentWeek.id,
          staff_id: staffId,
          monday: data.monday,
          tuesday: data.tuesday,
          wednesday: data.wednesday,
          thursday: data.thursday,
          friday: data.friday,
          saturday: data.saturday,
          sunday: data.sunday,
          extra_hours: data.extra_hours,
          vacation_days: data.vacation_days,
        },
        { onConflict: "shift_week_id,staff_id" }
      );

      if (error) throw error;

      toast.success(`Сохранено для ${members.find((m) => m.id === staffId)?.nickname}`);
    } catch (error: any) {
      toast.error("Ошибка сохранения: " + error.message);
    }
  };

  const shiftMembers = selectedShift ? members.filter((m) => m.shift_id === selectedShift) : [];

  return (
    <div>
      <PageHeader title="Ветка" subtitle={`Реестр персонала ${label}`} />
      <div className="space-y-6">
        {grouped.map(({ category, members: categoryMembers }, idx) => (
          <motion.div key={category.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <GlassCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl text-white/90">{category.name}</h2>
                {isAdmin && (
                  <button
                    onClick={() => setAdding(adding === category.id ? null : category.id)}
                    className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                  >
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
                      {staffRole === "moderator" && <th className="px-4 py-2 text-center font-normal">Баллы</th>}
                      {isAdmin && <th className="px-4 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {categoryMembers.map((m, idx) => (
                      <MemberRow
                        key={m.id}
                        m={m}
                        isAdmin={isAdmin}
                        index={idx}
                        showPoints={staffRole === "moderator"}
                        onSave={(patch) => upd.mutate({ id: m.id, patch }, { onSuccess: () => toast.success("Сохранено") })}
                        onDel={() => del.mutate(m.id, { onSuccess: () => toast.success("Удалено"), onError: (e: any) => toast.error("Ошибка: " + e.message) })}
                      />
                    ))}
                    {adding === category.id && (
                      <tr className="border-b border-white/5 bg-white/[0.04]">
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3">
                          <input autoFocus placeholder="nickname" value={newRow.nickname} onChange={(e) => setNewRow({ ...newRow, nickname: e.target.value })} className="w-full bg-transparent text-white focus:outline-none" />
                        </td>
                        <td className="px-4 py-3">
                          <input placeholder="discord id" value={newRow.discord_id} onChange={(e) => setNewRow({ ...newRow, discord_id: e.target.value })} className="w-full bg-transparent text-xs text-white/70 focus:outline-none" />
                        </td>
                        <td colSpan={4}></td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (!newRow.nickname) return;
                              ins.mutate(
                                { ...newRow, category: staffRole, category_id: category.id },
                                { onSuccess: () => { setNewRow({ nickname: "", discord_id: "" }); setAdding(null); toast.success("Добавлено"); } }
                              );
                            }}
                            className="text-emerald-300 hover:text-emerald-200"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )}
                    {categoryMembers.length === 0 && adding !== category.id && (
                      <tr>
                        <td colSpan={isAdmin ? (staffRole === "moderator" ? 9 : 8) : (staffRole === "moderator" ? 8 : 7)} className="py-6 text-center text-sm text-white/30">Нет участников</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {/* Shifts section - only for moderators */}
        {staffRole === "moderator" && isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: grouped.length * 0.05 }}
          >
            <GlassCard>
              <div className="mb-4">
                <h2 className="font-display text-2xl text-white/90 mb-4">Смены</h2>
                <select
                  value={selectedShift ?? ""}
                  onChange={(e) => handleShiftChange(Number(e.target.value))}
                  className="w-full rounded-md bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="">Выберите смену</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id} style={{ backgroundColor: "#0a0a0a" }}>
                      {shift.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedShift && currentWeek && !loadingShifts && (
                <div className="overflow-x-auto">
                  <div className="mb-2 text-xs text-white/50">
                    Неделя: {new Date(currentWeek.week_start).toLocaleDateString("ru-RU")} - {new Date(currentWeek.week_end).toLocaleDateString("ru-RU")}
                  </div>
                  {shiftMembers.length === 0 ? (
                    <p className="py-6 text-center text-sm text-white/30">Нет модераторов в этой смене</p>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                          <th className="px-4 py-2 font-normal">Модератор</th>
                          <th className="px-4 py-2 text-center font-normal">ПН</th>
                          <th className="px-4 py-2 text-center font-normal">ВТ</th>
                          <th className="px-4 py-2 text-center font-normal">СР</th>
                          <th className="px-4 py-2 text-center font-normal">ЧТ</th>
                          <th className="px-4 py-2 text-center font-normal">ПТ</th>
                          <th className="px-4 py-2 text-center font-normal">СБ</th>
                          <th className="px-4 py-2 text-center font-normal">ВС</th>
                          <th className="px-4 py-2 text-center font-normal">Доп. часы</th>
                          <th className="px-4 py-2 text-center font-normal">Баллы</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {shiftMembers.map((member) => {
                          const att = attendance[member.id] || {
                            monday: false,
                            tuesday: false,
                            wednesday: false,
                            thursday: false,
                            friday: false,
                            saturday: false,
                            sunday: false,
                            extra_hours: 0,
                            vacation_days: 0,
                          };

                          const pointsEarned = att.extra_hours / 2;

                          return (
                            <tr key={member.id} className="group border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                              <td className="px-4 py-3 text-sm text-white">{member.nickname}</td>
                              {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
                                <td key={day} className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={att[day]}
                                    onChange={(e) => updateAttendance(member.id, day, e.target.checked)}
                                    className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50"
                                  />
                                </td>
                              ))}
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="168"
                                  step="0.5"
                                  value={att.extra_hours}
                                  onChange={(e) => updateAttendance(member.id, "extra_hours", parseFloat(e.target.value) || 0)}
                                  className="w-20 rounded-md bg-white/5 px-2 py-1 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-sm font-medium text-emerald-300">
                                  +{pointsEarned.toFixed(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => saveAttendance(member.id)}
                                  className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/20"
                                >
                                  <Save className="h-3.5 w-3.5" /> Сохранить
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {loadingShifts && (
                <p className="py-6 text-center text-sm text-white/50">Загрузка...</p>
              )}
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
