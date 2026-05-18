import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Save } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList } from "@/lib/hooks/useTable";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/moderator-shifts")({ component: ModeratorShiftsPage });

type Shift = {
  id: number;
  name: string;
  branch_id: string;
};

type ShiftWeek = {
  id: number;
  shift_id: number;
  week_start: string;
  week_end: string;
  is_archived: boolean;
};

type Member = {
  id: string;
  nickname: string;
  shift_id: number | null;
  total_points: number;
};

type Attendance = {
  id: string;
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

function ModeratorShiftsPage() {
  const { role } = useAuthStore();
  const isAdmin = role === "admin" || role === "admin_moderator";

  const [selectedShift, setSelectedShift] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(false);

  const { data: shifts = [] } = useList<Shift>("shifts", { col: "name", asc: true });
  const { data: allMembers = [] } = useList<Member>("staff_members", { col: "nickname", asc: true });

  // Filter moderator shifts
  const moderatorShifts = shifts.filter((s) => s.branch_id);

  // Get members for selected shift
  const shiftMembers = selectedShift
    ? allMembers.filter((m) => m.shift_id === selectedShift)
    : [];

  // Load current week for selected shift
  const loadWeek = async (shiftId: number) => {
    setLoading(true);
    try {
      // Get or create current week
      const { data: week, error: weekError } = await supabase.rpc("create_new_week_for_shift", {
        p_shift_id: shiftId,
      });

      if (weekError) throw weekError;

      setSelectedWeek(week);

      // Load attendance for this week
      const { data: attendanceData, error: attError } = await supabase
        .from("shift_attendance")
        .select("*")
        .eq("shift_week_id", week);

      if (attError) throw attError;

      // Convert to map
      const attMap: Record<string, Attendance> = {};
      attendanceData?.forEach((a) => {
        attMap[a.staff_id] = a;
      });
      setAttendance(attMap);
    } catch (error: any) {
      toast.error("Ошибка загрузки недели: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShiftChange = (shiftId: number) => {
    setSelectedShift(shiftId);
    setSelectedWeek(null);
    setAttendance({});
    loadWeek(shiftId);
  };

  const updateAttendance = (staffId: string, field: keyof Attendance, value: any) => {
    setAttendance((prev) => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {
          id: "",
          shift_week_id: selectedWeek!,
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
    if (!selectedWeek) return;

    const data = attendance[staffId];
    if (!data) return;

    try {
      const { error } = await supabase.from("shift_attendance").upsert(
        {
          shift_week_id: selectedWeek,
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

      toast.success(`Сохранено для ${allMembers.find((m) => m.id === staffId)?.nickname}`);
    } catch (error: any) {
      toast.error("Ошибка сохранения: " + error.message);
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Смены" subtitle="Управление сменами модераторов" />
        <GlassCard>
          <p className="text-center text-white/50">Доступ запрещен. Только для администраторов.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Смены" subtitle="Управление сменами модераторов" />

      <div className="mb-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-white/40" />
            <select
              value={selectedShift ?? ""}
              onChange={(e) => handleShiftChange(Number(e.target.value))}
              className="flex-1 rounded-md bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{ colorScheme: "dark" }}
            >
              <option value="">Выберите смену</option>
              {moderatorShifts.map((shift) => (
                <option key={shift.id} value={shift.id} style={{ backgroundColor: "#0a0a0a" }}>
                  {shift.name}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>
      </div>

      {selectedShift && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <h2 className="mb-4 font-display text-2xl text-white/90">
              {moderatorShifts.find((s) => s.id === selectedShift)?.name} - Текущая неделя
            </h2>

            {shiftMembers.length === 0 ? (
              <p className="text-center text-white/50">Нет модераторов в этой смене</p>
            ) : (
              <div className="overflow-x-auto">
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
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {loading && (
        <GlassCard>
          <p className="text-center text-white/50">Загрузка...</p>
        </GlassCard>
      )}
    </div>
  );
}
