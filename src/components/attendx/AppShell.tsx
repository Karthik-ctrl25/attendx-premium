import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarRange,
  CheckCircle2,
  GraduationCap,
  Home,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { NotificationBell } from "@/components/attendx/NotificationBell";
import { useDailyReminder } from "@/lib/reminders";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/timetable", label: "Timetable", icon: CalendarRange },
  { to: "/attendance", label: "Attendance", icon: CheckCircle2 },
  { to: "/class", label: "Class", icon: GraduationCap },
  { to: "/profile", label: "Profile", icon: User },
];


function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-ink)] text-ink-foreground shadow-soft">
        <Sparkles className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-display text-[15px] font-semibold tracking-tight">AttendX</p>
        <p className="truncate text-[11px] text-muted-foreground">CMR University</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { meta, timetable, updateMeta } = useApp();
  useDailyReminder(meta, timetable, updateMeta);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", meta.theme === "dark");
  }, [meta.theme]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-dvh w-full overflow-x-hidden lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 p-5 lg:flex">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Brand />
          <NotificationBell />
        </div>
        <nav className="glass flex flex-col gap-1 rounded-3xl p-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                isActive(item.to)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive(item.to) ? (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-white/80 shadow-soft"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              ) : null}
              <item.icon className="relative size-[18px]" />
              <span className="relative">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 pb-28 lg:pb-10">
        <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6 lg:max-w-5xl lg:px-8">
          <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:hidden">
            <Brand />
            <NotificationBell />
          </header>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile tab bar */}
      <nav className="glass-strong fixed inset-x-3 bottom-3 z-40 flex items-center gap-0.5 rounded-[26px] px-1.5 py-2 lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5"
          >
            {isActive(item.to) ? (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-2xl bg-white/85 shadow-soft"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            ) : null}
            <item.icon
              className={cn(
                "relative size-[18px] shrink-0",
                isActive(item.to) ? "text-foreground" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "relative w-full truncate text-center text-[10px] font-medium",
                isActive(item.to) ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
