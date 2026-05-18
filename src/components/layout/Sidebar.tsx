import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, CalendarDays, Mic, Activity,
  Banknote, Heart, Ban, Settings, BookOpen, ShieldCheck, Dices, Clock,
} from "lucide-react";
import { useAuthStore, type AppRole } from "@/lib/stores/auth";
import { getBranch, isBranchAdmin, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/discord";
import { useList } from "@/lib/hooks/useTable";

type NavItem = { to: string; label: string; icon: any };

// Items shared by ALL roles
const sharedItems: NavItem[] = [
  { to: "/dashboard", label: "Панель", icon: LayoutDashboard },
  { to: "/meetings", label: "Собрания", icon: Mic },
  { to: "/blacklist", label: "Чёрный список", icon: Ban },
  { to: "/couples", label: "Пары", icon: Heart },
];

// Extra items only for broadcaster (and admin)
const broadcasterItems: NavItem[] = [
  { to: "/schedule", label: "Расписание трибун", icon: CalendarDays },
  { to: "/norms", label: "Нормы", icon: Activity },
  { to: "/salary", label: "Зарплата", icon: Banknote },
];

const bottomItems: NavItem[] = [
  { to: "/settings", label: "Настройки", icon: Settings },
];

// Map each role to its staff page route
const ROLE_STAFF_ROUTE: Record<StaffRole, string> = {
  broadcaster: "/staff",
  support: "/support-staff",
  control: "/control-staff",
  closemod: "/closemod-staff",
  eventsmod: "/eventsmod-staff",
  moderator: "/moderator-staff",
  content_maker: "/content_maker-staff",
  helper: "/helper-staff",
};

// Subtitle shown under logo
const ROLE_SUBTITLE: Partial<Record<AppRole, string>> = {
  admin: "ADMIN",
  broadcaster: "BROADCASTERS",
  support: "SUPPORT",
  control: "CONTROL",
  closemod: "CLOSEMOD",
  eventsmod: "EVENTSMOD",
  moderator: "MODERATORS",
  content_maker: "CONTENT",
  helper: "HELPERS",
  admin_broadcaster: "BROADCASTERS",
  admin_support: "SUPPORT",
  admin_control: "CONTROL",
  admin_closemod: "CLOSEMOD",
  admin_eventsmod: "EVENTSMOD",
  admin_moderator: "MODERATORS",
  admin_content_maker: "CONTENT",
  admin_helper: "HELPERS",
};

function buildNavItems(role: AppRole | null): NavItem[] {
  if (!role) return sharedItems;

  const branch = getBranch(role);
  const canAdmin = isBranchAdmin(role);

  // Staff page link — points to the role-specific route
  const staffRoute = (role === "admin" || role === "broadcaster" || role === "admin_broadcaster")
    ? "/staff"
    : branch
    ? `/${branch}-staff`
    : "/staff";

  const staffLabel = role === "admin" ? "Ветка (Broadcaster)" : "Ветка";
  const staffItem: NavItem = { to: staffRoute, label: staffLabel, icon: Users };
  const rulesItem: NavItem = { to: "/rules", label: "Памятка", icon: BookOpen };

  const adminItem: NavItem = { to: "/admin", label: "Админ-панель", icon: ShieldCheck };
  const rouletteItem: NavItem = { to: "/roulette", label: "Рулетка", icon: Dices };

  // Shifts page only for moderator admins
  const shiftsItem: NavItem = { to: "/moderator-shifts", label: "Смены", icon: Clock };

  if (role === "admin") {
    return [sharedItems[0], staffItem, rulesItem, ...broadcasterItems, ...sharedItems.slice(1), adminItem, rouletteItem];
  }

  if (role === "broadcaster" || role === "admin_broadcaster") {
    const base = [sharedItems[0], staffItem, rulesItem, ...broadcasterItems, ...sharedItems.slice(1)];
    return canAdmin ? [...base, adminItem, rouletteItem] : base;
  }

  // Moderator branch - add shifts page for admins
  if (branch === "moderator") {
    const base = [sharedItems[0], staffItem, shiftsItem, rulesItem, ...sharedItems.slice(1)];
    return canAdmin ? [...base, adminItem, rouletteItem] : base;
  }

  // All other staff/branch-admin roles
  const base = [sharedItems[0], staffItem, rulesItem, ...sharedItems.slice(1)];
  return canAdmin ? [...base, adminItem, rouletteItem] : base;
}

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuthStore();
  const { data: meetings = [] } = useList<any>("meetings", { col: "date", asc: true });

  const navItems = buildNavItems(role);
  const subtitle = (role && ROLE_SUBTITLE[role]) ?? "STAFF";
  const branch = getBranch(role ?? "");

  // Nearest upcoming meeting filtered by branch
  const now = new Date();
  const upcomingMeeting = meetings
    .filter((m) => {
      // Build full datetime from date + time fields
      const dateStr = m.time ? `${m.date}T${m.time}` : `${m.date}T23:59`;
      if (new Date(dateStr) <= now) return false;
      if (role === "admin") return true;
      return m.branch === branch || m.branch === null;
    })
    .sort((a, b) => {
      const aStr = a.time ? `${a.date}T${a.time}` : `${a.date}T23:59`;
      const bStr = b.time ? `${b.date}T${b.time}` : `${b.date}T23:59`;
      return new Date(aStr).getTime() - new Date(bStr).getTime();
    })[0];

  const getTimeUntilMeeting = () => {
    if (!upcomingMeeting) return null;
    const dateStr = upcomingMeeting.time
      ? `${upcomingMeeting.date}T${upcomingMeeting.time}`
      : `${upcomingMeeting.date}T23:59`;
    const meetingDate = new Date(dateStr);
    const diff = meetingDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days === 0) return hours > 0 ? `через ${hours}ч` : `сегодня`;
    if (days === 1) return "завтра";
    if (days < 7) return `через ${days} дн.`;
    return null;
  };

  const timeUntil = getTimeUntilMeeting();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-white/5 bg-black/60 backdrop-blur-2xl md:flex">
      <div className="flex items-center gap-3 px-6 py-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <img src="/logo.png" alt="Logo" className="h-6 w-6" />
        </div>
        <div>
          <div className="font-display text-lg leading-none text-white">Stockholm</div>
          <div className="font-display text-xs tracking-[0.3em] text-white/40">{subtitle}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to as any} className="group relative block">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-white/[0.06] ring-1 ring-white/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "text-white" : "text-white/50 hover:text-white/90"}`}>
                <Icon className="h-4 w-4" />
                <span className="tracking-wide">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 px-3 py-4">
        {upcomingMeeting && timeUntil && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-white/5 bg-white/[0.02] p-3"
          >
            <p className="mb-1 text-xs uppercase tracking-wider text-white/40">Скоро собрание</p>
            <p className="mb-1 text-sm text-white">{upcomingMeeting.title}</p>
            <p className="text-xs text-white/50">
              {timeUntil} · {new Date(upcomingMeeting.date).toLocaleDateString("ru-RU")}
              {upcomingMeeting.time && ` · ${upcomingMeeting.time}`}
            </p>
          </motion.div>
        )}
        <div className="space-y-1">
          {bottomItems.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to as any} className="group relative block">
                {active && (
                  <motion.div
                    layoutId="sidebar-active-bottom"
                    className="absolute inset-0 rounded-lg bg-white/[0.06] ring-1 ring-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "text-white" : "text-white/50 hover:text-white/90"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="tracking-wide">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
