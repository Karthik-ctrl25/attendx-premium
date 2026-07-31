export type SessionType = "Theory" | "Lab";

export interface Subject {
  code: string;
  name: string;
  faculty: string;
  present: number;
  absent: number;
  total: number;
  /** OCR confidence 0-100 for the imported row (absent for manual entries). */
  confidence?: number;
  /** True when the row needs a human look before saving. */
  flagged?: boolean;
  /** Why the row was flagged, shown in the review card. */
  flagReason?: string;
}



export interface ClassSlot {
  id: string;
  day: number; // 0 = Sunday ... 6 = Saturday
  start: string; // "08:30"
  end: string; // "09:30"
  code: string;
  name: string;
  faculty: string;
  room: string;
  session: SessionType;
}

export type AttendanceAction = "present" | "absent";

export interface HistoryEntry {
  id: string;
  ts: number;
  code: string;
  name: string;
  action: AttendanceAction;
  slotId?: string;
  undone?: boolean;
}

export interface AppMeta {
  setupComplete: boolean;
  studentName: string;
  university: string;
  createdAt: number;
  photo?: string;
  usn?: string;
  department?: string;
  semester?: string;
  section?: string;
  email?: string;
  reduceMotion?: boolean;
  /** Reserved for real auth (Google / Supabase) — "local" until then. */
  authProvider?: "local" | "google" | "phone";
}

/** Fingerprint of a saved attendance screenshot import (duplicate guard). */
export interface AttendanceImport {
  id: string;
  ts: number;
  fileHash: string;
  dataHash: string;
  subjectCount: number;
  confidence: number;
}


export interface BackupPayload {
  version: 1;
  exportedAt: number;
  meta: AppMeta;
  subjects: Subject[];
  timetable: ClassSlot[];
  history: HistoryEntry[];
}

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
