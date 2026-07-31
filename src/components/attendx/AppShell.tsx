import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  History,
  Home,
  Lock,
  Settings,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/today", label: "Today", icon: Sun },
  { to: "/timetable", label: "Timetable", icon: CalendarRange },
  { to: "/attendance", label: "Attendance", icon: CheckCircle2 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const FUTURE_MODULES = [
  "Assignments",
  "Announcements",
  "Notes",
  "Community",
  "Marks",
  "CGPA",
  "Teacher Portal",
  "Cloud Sync",
  "AI Assistant",
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl bg-[image:var(--gradient-ink)] text-ink-foreground shadow-soft">
        <Sparkles className="size-4" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-[15px] font-semibold tracking-tight">AttendX</p>
        <p className="text-[11px] text-muted-foreground">CMR University</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 p-5 lg:flex">
        <Brand />
        <nav className="glass flex flex-col gap-1 rounded-3xl p-2">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-white/80 shadow-soft"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                ) : null}
                <item.icon className="relative size-[18px]" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="glass rounded-3xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Coming soon
          </p>
          <ul className="mt-3 space-y-2">
            {FUTURE_MODULES.slice(0, 6).map((m) => (
              <li key={m} className="flex items-center gap-2 text-sm text-muted-foreground/80">
                <Lock className="size-3.5" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-28 lg:pb-10">
        <div className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Brand />
          </div>
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
      <nav className="glass-strong fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-[26px] px-2 py-2 lg:hidden">
        {NAV.filter((n) => n.to !== "/history").map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5"
            >
              {active ? (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-2xl bg-white/85 shadow-soft"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              ) : null}
              <item.icon
                className={cn(
                  "relative size-[18px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "relative text-[10px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
