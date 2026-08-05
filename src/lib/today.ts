/**
 * Shared "today" helpers so Home and the Attendance hub agree on which classes
 * are scheduled and which have already been marked.
 */
import type { AttendanceAction, ClassSlot, HistoryEntry } from "./types";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Today's classes from the (published) timetable, sorted by start time. */
export function todaysSlots(timetable: ClassSlot[]): ClassSlot[] {
  const day = new Date().getDay();
  return timetable.filter((s) => s.day === day).sort((a, b) => a.start.localeCompare(b.start));
}

/** slotId → action for everything already marked today (one mark per class). */
export function todaysMarks(history: HistoryEntry[]): Record<string, AttendanceAction> {
  const from = startOfToday();
  const map: Record<string, AttendanceAction> = {};
  for (const h of history) {
    if (h.undone || !h.slotId || h.ts < from) continue;
    if (!map[h.slotId]) map[h.slotId] = h.action;
  }
  return map;
}
