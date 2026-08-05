import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CalendarRange,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Users,
  Vote,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/timetables", label: "Timetables", icon: CalendarRange },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/polls", label: "Polls", icon: Vote },
  { to: "/admin/cr", label: "CR Requests", icon: ShieldCheck },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const MOBILE_PRIMARY: AdminNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/timetables", label: "Timetables", icon: CalendarRange },
  { to: "/admin/announcements", label: "Posts", icon: Megaphone },
];

const MOBILE_MORE = ADMIN_NAV.filter(
  (i) => !MOBILE_PRIMARY.some((p) => p.to === i.to) && i.to !== "/admin",
);

function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
}

function AdminBrand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-ink)] text-ink-foreground shadow-soft">
        <ShieldCheck className="size-4" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-display text-[15px] font-semibold tracking-tight">
          AttendX Admin
        </p>
        <p className="truncate text-[11px] text-muted-foreground">Console</p>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const signOut = useSignOut();

  const isActive = (item: AdminNavItem) =>
    item.exact ? pathname === item.to || pathname === "/admin/" : pathname.startsWith(item.to);

  const title = ADMIN_NAV.find((i) => isActive(i))?.label ?? "Admin";

  return (
    <div className="min-h-dvh w-full overflow-x-hidden lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 border-r border-foreground/5 p-5 lg:flex">
        <AdminBrand />
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium transition-colors",
                isActive(item)
                  ? "bg-foreground/[0.07] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
              )}
            >
              <item.icon className="size-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium text-bad transition-colors hover:bg-bad/10"
        >
          <LogOut className="size-[18px] shrink-0" />
          Logout
        </button>
      </aside>

      <main className="min-w-0 flex-1 pb-28 lg:pb-10">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
          <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:hidden">
            <AdminBrand />
            <span className="shrink-0 rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] text-muted-foreground">
              {title}
            </span>
          </header>
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="glass-strong fixed inset-x-3 bottom-3 z-40 flex items-center gap-0.5 rounded-[26px] px-1.5 py-2 lg:hidden">
        {MOBILE_PRIMARY.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMoreOpen(false)}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5"
          >
            {isActive(item) && !moreOpen ? (
              <motion.span
                layoutId="admin-tab-pill"
                className="absolute inset-0 rounded-2xl bg-white/85 shadow-soft"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            ) : null}
            <item.icon
              className={cn(
                "relative size-[18px] shrink-0",
                isActive(item) && !moreOpen ? "text-foreground" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "relative w-full truncate text-center text-[10px] font-medium",
                isActive(item) && !moreOpen ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5"
        >
          {moreOpen ? (
            <motion.span
              layoutId="admin-tab-pill"
              className="absolute inset-0 rounded-2xl bg-white/85 shadow-soft"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          ) : null}
          <MoreHorizontal
            className={cn(
              "relative size-[18px] shrink-0",
              moreOpen ? "text-foreground" : "text-muted-foreground",
            )}
          />
          <span
            className={cn(
              "relative w-full truncate text-center text-[10px] font-medium",
              moreOpen ? "text-foreground" : "text-muted-foreground",
            )}
          >
            More
          </span>
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      <AnimatePresence>
        {moreOpen ? (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMoreOpen(false)}
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[3px] lg:hidden"
            />
            <motion.div
              initial={{ y: 28, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.7 }}
              role="dialog"
              aria-label="More admin sections"
              className="glass-strong fixed inset-x-3 bottom-24 z-40 overflow-hidden rounded-[28px] border border-foreground/10 p-2.5 shadow-soft lg:hidden"
            >
              <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-foreground/15" />
              <div className="mb-1 flex items-center justify-between px-2">
                <p className="text-[12.5px] font-semibold tracking-tight">More</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close"
                  className="grid size-7 place-items-center rounded-full bg-foreground/[0.07] transition-colors active:bg-foreground/15"
                >
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-1">
                {MOBILE_MORE.map((item, index) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 + index * 0.025, duration: 0.2 }}
                  >
                    <Link
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-3 text-[13.5px] font-medium transition-colors",
                        isActive(item)
                          ? "bg-foreground/[0.09] text-foreground"
                          : "text-foreground/90 active:bg-foreground/[0.06]",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-foreground/[0.06]">
                        <item.icon className="size-[17px] text-muted-foreground" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="my-2 h-px bg-foreground/8" />
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[13.5px] font-medium text-bad transition-colors active:bg-bad/10"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-bad/10">
                  <LogOut className="size-[17px]" />
                </span>
                Logout
              </button>
            </motion.div>

          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
