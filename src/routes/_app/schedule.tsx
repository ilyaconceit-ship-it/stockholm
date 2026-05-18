import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList, useInsert, useUpdate } from "@/lib/hooks/useTable";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/schedule")({ component: SchedulePage });

const TRIBUNE_TYPES = [
  "Шоу подкатов",
  "Синяя кнопка",
  "Быстрые свидания",
  "Ночные свидания",
  "Случайный диалог",
];

type ScheduleEntry = {
  id?: string;
  date: string;
  tribune_type: string;
  time: string;
  host1_first: string;
  host2_first: string;
  host1_second: string;
  host2_second: string;
  ad_branches: string;
};

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekDates(weekStart: Date): string[] {
  const monday = new Date(weekStart);
  const tuesday = new Date(weekStart);
  tuesday.setDate(monday.getDate() + 1);
  const thursday = new Date(weekStart);
  thursday.setDate(monday.getDate() + 3);
  const saturday = new Date(weekStart);
  saturday.setDate(monday.getDate() + 5);

  return [
    formatDate(monday),
    formatDate(tuesday),
    formatDate(thursday),
    formatDate(saturday),
  ];
}

function SchedulePage() {
  const { role } = useAuthStore();
  const isAdmin = role === "admin" || role === "admin_broadcaster";
  const { data: allSchedules = [] } = useList<ScheduleEntry>("schedules", { col: "date", asc: true });
  const ins = useInsert("schedules");
  const upd = useUpdate("schedules");

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [weekSchedule, setWeekSchedule] = useState<Record<string, ScheduleEntry>>({});

  const weekDates = getWeekDates(currentWeekStart);
  const weekLabels = ["Понедельник", "Вторник", "Четверг", "Суббота"];

  useEffect(() => {
    const schedule: Record<string, ScheduleEntry> = {};
    weekDates.forEach((date) => {
      const existing = allSchedules.find((s) => s.date === date);
      if (existing) {
        schedule[date] = existing;
      } else {
        schedule[date] = {
          date,
          tribune_type: "",
          time: "",
          host1_first: "",
          host2_first: "",
          host1_second: "",
          host2_second: "",
          ad_branches: "",
        };
      }
    });
    setWeekSchedule(schedule);
  }, [currentWeekStart, allSchedules]);

  const updateField = (date: string, field: keyof ScheduleEntry, value: string) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [date]: { ...prev[date], [field]: value },
    }));
  };

  const saveEntry = async (date: string) => {
    const entry = weekSchedule[date];
    if (!entry) return;

    try {
      if (entry.id) {
        await upd.mutateAsync({ id: entry.id, patch: entry });
      } else {
        const result = await ins.mutateAsync(entry);
        setWeekSchedule((prev) => ({
          ...prev,
          [date]: { ...entry, id: result.id },
        }));
      }
      toast.success("Сохранено");
    } catch (error: any) {
      toast.error("Ошибка: " + error.message);
    }
  };

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  return (
    <div>
      <PageHeader title="Расписание трибун" subtitle="Заполняется мастерами и выше" />

      <div className="mb-6">
        <GlassCard>
          <div className="flex items-center justify-between">
            <button
              onClick={prevWeek}
              className="flex items-center gap-2 rounded-md bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" /> Предыдущая неделя
            </button>
            <div className="text-center">
              <div className="font-display text-lg text-white">
                {formatDisplayDate(weekDates[0])} — {formatDisplayDate(weekDates[3])}
              </div>
              <div className="text-xs text-white/40">Неделя {Math.ceil((currentWeekStart.getTime() - new Date(currentWeekStart.getFullYear(), 0, 1).getTime()) / 604800000)}</div>
            </div>
            <button
              onClick={nextWeek}
              className="flex items-center gap-2 rounded-md bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
            >
              Следующая неделя <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-4">
        {weekDates.map((date, idx) => {
          const entry = weekSchedule[date];
          if (!entry) return null;

          return (
            <GlassCard key={date}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl text-white">{weekLabels[idx]}</h3>
                  <p className="text-sm text-white/50">{formatDisplayDate(date)}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => saveEntry(date)}
                    className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
                  >
                    <Save className="h-4 w-4" /> Сохранить
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">Тип трибуны</label>
                  {isAdmin ? (
                    <select
                      value={entry.tribune_type}
                      onChange={(e) => updateField(date, "tribune_type", e.target.value)}
                      className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">Выберите тип</option>
                      {TRIBUNE_TYPES.map((type) => (
                        <option key={type} value={type} style={{ backgroundColor: "#0a0a0a" }}>
                          {type}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">{entry.tribune_type || "—"}</div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">Время</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      value={entry.time}
                      onChange={(e) => updateField(date, "time", e.target.value)}
                      placeholder="19:00"
                      className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  ) : (
                    <div className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">{entry.time || "—"}</div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">Ведущий 1</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      value={entry.host1_first}
                      onChange={(e) => updateField(date, "host1_first", e.target.value)}
                      className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  ) : (
                    <div className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">{entry.host1_first || "—"}</div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">Ведущий 2</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      value={entry.host2_first}
                      onChange={(e) => updateField(date, "host2_first", e.target.value)}
                      className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  ) : (
                    <div className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">{entry.host2_first || "—"}</div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">Ведущий 3</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      value={entry.host1_second}
                      onChange={(e) => updateField(date, "host1_second", e.target.value)}
                      className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  ) : (
                    <div className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">{entry.host1_second || "—"}</div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">Ведущий 4</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      value={entry.host2_second}
                      onChange={(e) => updateField(date, "host2_second", e.target.value)}
                      className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  ) : (
                    <div className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">{entry.host2_second || "—"}</div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">Реклама</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      value={entry.ad_branches}
                      onChange={(e) => updateField(date, "ad_branches", e.target.value)}
                      className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  ) : (
                    <div className="rounded-md bg-white/5 px-3 py-2 text-sm text-white">{entry.ad_branches || "—"}</div>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
