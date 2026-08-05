/**
 * Local notification centre.
 *
 * Notifications are *derived* from local state (attendance, ERP verification,
 * semester, class space) — nothing is stored or synced. Unread state is a
 * single timestamp on AppMeta (`notificationsSeenAt`).
 */
import type { Announcement, AppMeta, ClassEvent, ClassSlot, Poll } from "./types";
import { pendingSemester, SEMESTER_LENGTH_DAYS } from "./semester";

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
  const { meta, announcements, polls, events } = input;
  const now = input.now ?? Date.now();
  const date = new Date(now);
  const list: AppNotification[] = [];

  // Weekly ERP verification.
  if (!meta.lastVerifiedAt || now - meta.lastVerifiedAt >= 7 * DAY) {
    list.push({
      id: `verify-${Math.floor(now / DAY)}`,
      kind: "verify",
      title: "\uD83D\uDCF8 Weekly attendance check",
      body: "It's been a week since your last attendance verification. Open the CMR ERP, take a screenshot and upload it into AttendX.",
      ts: (meta.lastVerifiedAt ?? now - 7 * DAY) + 7 * DAY,
      to: "/verify",
    });
  }

  // Semester rollover.
  const nextSem = pendingSemester(meta, now);
  if (nextSem) {
    list.push({
      id: `semester-${meta.semester ?? "x"}`,
      kind: "semester",
      title: "A new semester has started",
      body: `Are you now in Semester ${nextSem}? Confirm to load the right timetable.`,
      ts: (meta.semesterStartedAt ?? now) + SEMESTER_LENGTH_DAYS * DAY,
      to: "/",
    });
  }

  for (const a of announcements.slice(0, 8)) {
    list.push({
      id: `ann-${a.id}`,
      kind: "announcement",
      title: a.title,
      body: `${a.pinned ? "Pinned · " : ""}Announcement from ${a.authorName}`,
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
