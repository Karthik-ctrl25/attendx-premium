/**
 * Local timetable dataset for CMR University.
 *
 * ── FOR THE ADMINISTRATOR ────────────────────────────────────────────────
 * Students no longer upload their schedule. During onboarding they pick
 * Department → Semester → Section, and the matching timetable below is
 * loaded automatically.
 *
 * To add a class timetable:
 *   1. Add the department to `DEPARTMENTS` (if new).
 *   2. Add an entry to `TIMETABLE_DATASET` with the key
 *      `${department}|${semester}|${section}` (exact strings).
 *   3. List the weekly classes. `day` is 0 = Sunday … 6 = Saturday.
 *
 * This file is the single source of truth and is designed to be replaced by
 * a remote/admin-managed dataset later without touching any UI code.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { ClassSlot, SessionType } from "./types";

export const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Science & Engineering",
  "Artificial Intelligence & Machine Learning",
  "Electronics & Communication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
] as const;

export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export const SECTIONS = ["A", "B", "C", "D"] as const;

/** A class entry without a runtime id — ids are generated on load. */
export interface DatasetSlot {
  day: number;
  start: string;
  end: string;
  code: string;
  name: string;
  faculty: string;
  room: string;
  session: SessionType;
}

export type TimetableKey = `${string}|${string}|${string}`;

export const datasetKey = (department: string, semester: string, section: string): TimetableKey =>
  `${department}|${semester}|${section}`;

/**
 * Replace the placeholder entry below with real CMR University timetables.
 * Keys must match `datasetKey(department, semester, section)`.
 */
export const TIMETABLE_DATASET: Partial<Record<TimetableKey, DatasetSlot[]>> = {
  [datasetKey("Computer Science & Engineering", "5", "A")]: [
    {
      day: 1,
      start: "09:00",
      end: "10:00",
      code: "CSE501",
      name: "Placeholder Course",
      faculty: "To be updated",
      room: "—",
      session: "Theory",
    },
  ],
};

let seq = 0;
const uid = () => `slot_${Date.now().toString(36)}_${(seq += 1)}`;

/** Returns the stored timetable for a class, or an empty array when unknown. */
export function getTimetableFor(
  department: string,
  semester: string,
  section: string,
): ClassSlot[] {
  const rows = TIMETABLE_DATASET[datasetKey(department, semester, section)] ?? [];
  return rows
    .map((r) => ({ ...r, id: uid() }))
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
}

export function hasTimetableFor(department: string, semester: string, section: string) {
  return (TIMETABLE_DATASET[datasetKey(department, semester, section)] ?? []).length > 0;
}
