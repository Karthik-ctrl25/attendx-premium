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

import type { Role } from "./roles";

export type ReactionKind = "helpful" | "thanks";

export interface Announcement {
  id: string;
  ts: number;
  title: string;
  body: string;
  authorName: string;
  authorRole: Role;
  pinned?: boolean;
  reactions: Record<ReactionKind, number>;
  /** The current student's reaction (local device). */
  myReaction?: ReactionKind | null;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  ts: number;
  question: string;
  options: PollOption[];
  closed?: boolean;
  /** CR/Admin can pin an important poll to the top. */
  pinned?: boolean;
  /** Option id this device voted for. */
  myVote?: string | null;
}

export type ClassEventKind = "Assignment" | "Seminar" | "Lab Exam" | "IA";

export interface ClassEvent {
  id: string;
  kind: ClassEventKind;
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
  note?: string;
}

export type ResourceKind = "PDF" | "PPT" | "Link";

export interface ClassResource {
  id: string;
  ts: number;
  kind: ResourceKind;
  title: string;
  url: string;
}

export type CrRequestStatus = "pending" | "approved" | "rejected";

export interface CrRequest {
  id: string;
  ts: number;
  name: string;
  usn: string;
  reason: string;
  status: CrRequestStatus;
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
  /** UI theme — light is the default. */
  theme?: "light" | "dark";
  /** Reserved for real auth (Google / Supabase) — "local" until then. */
  authProvider?: "local" | "google" | "email" | "phone";
  /** Daily "did you attend?" reminder. */
  reminderEnabled?: boolean;
  /** 24h "HH:MM" — default 19:00. */
  reminderTime?: string;
  /** "YYYY-MM-DD" of the last fired reminder (fires once per day). */
  lastReminderDate?: string;
  /** Timestamp of the last ERP screenshot verification. */
  lastVerifiedAt?: number;
  /** Class role. Roles exist in V1 so the model is ready for a real backend. */
  role?: Role;
  /** Status of this student's Class Representative application, if any. */
  crRequestStatus?: CrRequestStatus | "none";
  /** When the current semester was set (used to offer the next semester). */
  semesterStartedAt?: number;
  /** Semester number the student postponed moving to ("Later"). */
  semesterPromptSnoozedFor?: string;
  /** Set right after a semester change until the fresh ERP upload is done. */
  semesterUploadPending?: boolean;
  /** Everything in the notification centre older than this is read. */
  notificationsSeenAt?: number;
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
