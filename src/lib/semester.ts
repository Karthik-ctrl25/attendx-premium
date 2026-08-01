/**
 * Semester lifecycle.
 *
 * Offline-first: with no backend we can't be told when a term rolls over, so
 * AttendX watches the local clock. A CMR semester runs roughly six months, so
 * once the current one has been active for ~5 months we ask the student to
 * confirm the new semester. Nothing changes without an explicit "Yes".
 */
import type { AppMeta } from "./types";
import { SEMESTERS } from "./timetable-dataset";

const DAY = 24 * 60 * 60 * 1000;
export const SEMESTER_LENGTH_DAYS = 150;

export function nextSemester(current: string | undefined): string | null {
  const index = SEMESTERS.indexOf((current ?? "") as (typeof SEMESTERS)[number]);
  if (index < 0) return null;
  return SEMESTERS[index + 1] ?? null;
}

/** The semester to offer, or null when it's not time (or nothing left). */
export function pendingSemester(meta: AppMeta, now = Date.now()): string | null {
  if (!meta.setupComplete) return null;
  const next = nextSemester(meta.semester);
  if (!next) return null;
  if (meta.semesterPromptSnoozedFor === next) return null;
  const started = meta.semesterStartedAt || meta.createdAt;
  if (!started) return null;
  return now - started >= SEMESTER_LENGTH_DAYS * DAY ? next : null;
}
