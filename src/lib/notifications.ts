/**
 * Local notification centre.
 *
 * Notifications are *derived* from local state (attendance, ERP verification,
 * semester, class space) — nothing is stored or synced. Unread state is a
 * single timestamp on AppMeta (`notificationsSeenAt`).
 */
import type { Announcement, AppMeta, ClassEvent, ClassSlot, Poll } from "./types";
import { needsWeeklyVerification } from "./attendance-import";
import { shouldOfferNextSemester } from "./semester";
import { todayKey } from "./reminders";

export type NotificationKind =
  | "attendance"
  | "verify"
  | "semester"
  | "announcement"
  | "poll"
  | "event";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Sort + unread comparison timestamp. */
  ts: number;
  to?: string;
}

const DAY = 86_400_000;

export function buildNotifications(input: {
  meta: AppMeta;
  timetable: ClassSlot[];
  announcements: Announcement[];
  polls: Poll[];
  events: ClassEvent[];
  now?: number;
}): AppNotification[] {
  const { meta, timetable, announcements, polls, events } = input;
  const now = input.now ?? Date.now();
  const date = new Date(now);
  const list: AppNotification[] = [];

  // Daily attendance reminder — only once the reminder hour has passed.
  const [rh, rm] = (meta.reminderTime || "19:00").split(":").map(Number);
  const dueToday = date.getHours() * 60 + date.getMinutes() >= (rh || 19) * 60 + (rm || 0);
  const todaysClasses = timetable.filter((s) => s.day === date.getDay()).length;
  if (meta.reminderEnabled !== false && dueToday && todaysClasses > 0) {
    const start = new Date(date);
    start.setHours(rh || 19, rm || 0, 0, 0);
    list.push({
      id: `attendance-${todayKey(date)}`,
      kind: "attendance",
      title: "Mark today's attendance",
      body: `Did you attend today's ${todaysClasses} class${todaysClasses > 1 ? "es" : ""}?`,
      ts: start.getTime(),
      to: "/attendance",
    });
  }

  // Weekly ERP verification.
  if (needsWeeklyVerification(meta.lastVerifiedAt)) {
    list.push({
      id: `verify-${Math.floor(now / DAY)}`,
      kind: "verify",
      title: "Verify attendance with ERP",
      body: meta.lastVerifiedAt
        ? `Last verified ${new Date(meta.lastVerifiedAt).toLocaleDateString()}`
        : "You haven't verified against the ERP yet.",
      ts: (meta.lastVerifiedAt ?? now - 7 * DAY) + 7 * DAY,
      to: "/verify",
    });
  }

  // Semester rollover.
  if (shouldOfferNextSemester(meta)) {
    list.push({
      id: `semester-${meta.semester ?? "x"}`,
      kind: "semester",
      title: "A new semester may have started",
      body: "Confirm your semester to load the right timetable.",
      ts: (meta.semesterStartedAt ?? now) + 150 * DAY,
      to: "/profile",
    });
  }

  for (const a of announcements.slice(0, 8)) {
    list.push({
      id: `ann-${a.id}`,
      kind: "announcement",
      title: a.pinned ? `📌 ${a.title}` : a.title,
      body: `Announcement from ${a.authorName}`,
      ts: a.ts,
      to: "/class",
    });
  }

  for (const p of polls.slice(0, 8)) {
    if (p.closed) continue;
    list.push({
      id: `poll-${p.id}`,
      kind: "poll",
      title: p.myVote ? "Poll results" : "New poll — cast your vote",
      body: p.question,
      ts: p.ts,
      to: "/class",
    });
  }

  for (const e of events) {
    const due = new Date(`${e.date}T09:00:00`).getTime();
    if (Number.isNaN(due) || due < now - DAY) continue;
    if (due > now + 7 * DAY) continue;
    list.push({
      id: `evt-${e.id}`,
      kind: "event",
      title: `${e.kind} due soon`,
      body: `${e.title} · ${new Date(`${e.date}T00:00:00`).toLocaleDateString()}`,
      ts: due - 2 * DAY,
      to: "/class",
    });
  }

  return list.filter((n) => n.ts <= now + DAY).sort((a, b) => b.ts - a.ts);
}

export function unreadCount(list: AppNotification[], seenAt?: number) {
  return list.filter((n) => n.ts > (seenAt ?? 0)).length;
}
