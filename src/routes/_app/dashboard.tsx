import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, CalendarDays, Mic, Activity, Sparkles, Crown } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList } from "@/lib/hooks/useTable";
import { useAuthStore } from "@/lib/stores/auth";
import { getBranch, isBranchAdmin, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/discord";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function StatCard({ icon: Icon, label, value, hint, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass hover-lift rounded-2xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
          <p className="mt-3 font-display text-4xl font-light text-glow">{value}</p>
          {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
          <Icon className="h-5 w-5 text-white/70" />
        </div>
      </div>
    </motion.div>
  );
}

function Dashboard() {
  const { username, role } = useAuthStore();
  const branch = getBranch(role ?? "");
  const isBroadcasterBranch = branch === "broadcaster" || role === "admin";

  const { data: allStaff = [] } = useList<any>("staff_members");
  const { data: meetings = [] } = useList<any>("meetings", { col: "date", asc: false });
  const { data: schedules = [] } = useList<any>("schedules", { col: "date", asc: true });
  const { data: logs = [] } = useList<any>("activity_logs", { col: "created_at", asc: false });

  // Filter staff to current branch (super admin sees all)
  const staff = role === "admin"
    ? allStaff
    : allStaff.filter((s) => s.category === branch);

  const active = staff.filter((s) => s.active).length;
  const today = new Date().toISOString().slice(0, 10);

  // Meetings filtered by branch
  const branchMeetings = role === "admin"
    ? meetings
    : meetings.filter((m) => m.branch === branch || m.branch === null);
  const nextMeeting = branchMeetings.find((m) => m.date >= today);

  const todayTribune = schedules.find((s) => s.date === today);

  const roleLabel = role === "admin"
    ? "Полные административные права"
    : branch
    ? `Ветка ${STAFF_ROLE_LABELS[branch]}`
    : "Доступ только для чтения";

  const branchMemberLabel = role === "admin"
    ? "Всего сотрудников"
    : `Сотрудников (${branch ? STAFF_ROLE_LABELS[branch] : "ветка"})`;

  return (
    <div>
      <PageHeader
        title={`Добро пожаловать, ${username ?? "оператор"}`}
        subtitle={roleLabel}
        action={
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span className="text-white/60">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</span>
          </div>
        }
      />

      {/* Broadcaster / Admin: 4 stat cards including tribune */}
      {isBroadcasterBranch ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label={branchMemberLabel} value={staff.length} delay={0} />
          <StatCard icon={Crown} label="Активных" value={active} hint={`${staff.length - active} в отпуске`} delay={0.1} />
          <StatCard icon={CalendarDays} label="Следующее собрание" value={nextMeeting ? new Date(nextMeeting.date).toLocaleDateString("ru-RU") : "—"} delay={0.2} />
          <StatCard icon={Mic} label="Сегодняшняя трибуна" value={todayTribune?.tribune_type ?? "—"} hint={todayTribune?.time} delay={0.3} />
        </div>
      ) : (
        // Other branches: 3 stat cards, no tribune
        <div className="grid gap-5 md:grid-cols-3">
          <StatCard icon={Users} label={branchMemberLabel} value={staff.length} delay={0} />
          <StatCard icon={Crown} label="Активных" value={active} hint={`${staff.length - active} в отпуске`} delay={0.1} />
          <StatCard icon={CalendarDays} label="Следующее собрание" value={nextMeeting ? new Date(nextMeeting.date).toLocaleDateString("ru-RU") : "—"} delay={0.2} />
        </div>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Broadcaster/Admin: show upcoming tribunes */}
        {isBroadcasterBranch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
            <GlassCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl">Предстоящие трибуны</h2>
                <Activity className="h-4 w-4 text-white/30" />
              </div>
              <div className="space-y-2">
                {schedules.slice(0, 6).map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-display text-2xl text-white/70">{new Date(s.date).getDate().toString().padStart(2, "0")}</div>
                      <div>
                        <p className="text-sm text-white">{s.tribune_type ?? "—"}</p>
                        <p className="text-xs text-white/40">{s.time ?? ""} · {s.ad_branches ?? ""}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {schedules.length === 0 && <p className="py-8 text-center text-sm text-white/30">Нет запланированных трибун</p>}
              </div>
            </GlassCard>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={isBroadcasterBranch ? "" : "lg:col-span-3"}
        >
          <GlassCard>
            <h2 className="mb-4 font-display text-xl">Последняя активность</h2>
            <div className="space-y-3">
              {logs.slice(0, 6).map((l) => (
                <div key={l.id} className="text-xs">
                  <p className="text-white/80">{l.action}</p>
                  <p className="text-white/30">{new Date(l.created_at).toLocaleString("ru-RU")}</p>
                </div>
              ))}
              {logs.length === 0 && <p className="py-8 text-center text-sm text-white/30">Пока нет активности</p>}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
