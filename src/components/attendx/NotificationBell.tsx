import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Megaphone,
  ShieldCheck,
  Vote,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useClassSpace } from "@/lib/class-store";
import { buildNotifications, unreadCount, type NotificationKind } from "@/lib/notifications";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const ICON: Record<NotificationKind, typeof Bell> = {
  attendance: CheckCircle2,
  verify: ShieldCheck,
  semester: GraduationCap,
  announcement: Megaphone,
  poll: Vote,
  event: CalendarClock,
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Bell + panel. Notifications are derived locally — nothing leaves the device. */
export function NotificationBell({ className }: { className?: string }) {
  const { meta, timetable, updateMeta } = useApp();
  const { announcements, polls, events } = useClassSpace();
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => buildNotifications({ meta, timetable, announcements, polls, events }),
    [announcements, events, meta, polls, timetable],
  );
  const unread = unreadCount(items, meta.notificationsSeenAt);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      void updateMeta({ notificationsSeenAt: Date.now() });
    }, 600);
    return () => window.clearTimeout(t);
  }, [open, updateMeta]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        onClick={() => setOpen((o) => !o)}
        className="glass glass-hover relative grid size-11 shrink-0 place-items-center rounded-2xl"
      >
        <Bell className="size-[18px] text-muted-foreground" />
        {unread ? (
          <span className="tnum absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-bad px-1 text-[10px] font-semibold leading-[18px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close notifications"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(20rem,calc(100vw-2.5rem))] overflow-hidden rounded-3xl p-2"
            >
              <p className="px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Notifications
              </p>
              {items.length ? (
                <div className="max-h-[60vh] space-y-1 overflow-y-auto overscroll-contain">
                  {items.map((n) => {
                    const Icon = ICON[n.kind];
                    const isNew = n.ts > (meta.notificationsSeenAt ?? 0);
                    const body = (
                      <>
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft",
                            isNew && "ring-1 ring-foreground/10",
                          )}
                        >
                          <Icon className="size-4 text-muted-foreground" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-semibold">{n.title}</span>
                            {isNew ? (
                              <span className="size-1.5 shrink-0 rounded-full bg-bad" />
                            ) : null}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {n.body}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">
                            {timeAgo(n.ts)}
                          </span>
                        </span>
                      </>
                    );
                    const cls =
                      "flex w-full min-w-0 items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/60";
                    return n.to ? (
                      <Link key={n.id} to={n.to} onClick={() => setOpen(false)} className={cls}>
                        {body}
                      </Link>
                    ) : (
                      <div key={n.id} className={cls}>
                        {body}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  You're all caught up.
                </p>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
