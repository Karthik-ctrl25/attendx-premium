/**
 * Role & permission model for AttendX.
 *
 * V1 is offline-first (IndexedDB only), but the permission surface is written
 * so it can be enforced server-side later (Supabase RLS + policies) without
 * touching any UI code. Every mutating action goes through `assertCan`.
 */

export type Role = "student" | "cr" | "admin";

export type Permission =
  | "announcement.read"
  | "announcement.react"
  | "announcement.create"
  | "announcement.pin"
  | "announcement.delete"
  | "poll.vote"
  | "poll.create"
  | "poll.edit"
  | "poll.delete"
  | "event.manage"
  | "resource.manage"
  | "cr.apply"
  | "cr.approve"
  | "timetable.manage"
  | "semester.manage"
  | "users.manage";

const STUDENT: Permission[] = [
  "announcement.read",
  "announcement.react",
  "poll.vote",
  "cr.apply",
];

const CR: Permission[] = [
  ...STUDENT.filter((p) => p !== "cr.apply"),
  "announcement.create",
  "announcement.pin",
  "poll.create",
  "event.manage",
  "resource.manage",
];

const ADMIN: Permission[] = [
  "announcement.read",
  "announcement.react",
  "announcement.create",
  "announcement.pin",
  "announcement.delete",
  "poll.vote",
  "poll.create",
  "poll.edit",
  "poll.delete",
  "event.manage",
  "resource.manage",
  "cr.approve",
  "timetable.manage",
  "semester.manage",
  "users.manage",
];

const MATRIX: Record<Role, Permission[]> = {
  student: STUDENT,
  cr: CR,
  admin: ADMIN,
};

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  cr: "Class Representative",
  admin: "Admin",
};

export function can(role: Role | undefined, permission: Permission): boolean {
  return MATRIX[role ?? "student"].includes(permission);
}

export class PermissionError extends Error {
  constructor(permission: Permission) {
    super(`You do not have permission to perform this action (${permission}).`);
    this.name = "PermissionError";
  }
}

/** Throws when the current role may not perform `permission`. Never trust the UI. */
export function assertCan(role: Role | undefined, permission: Permission): void {
  if (!can(role, permission)) throw new PermissionError(permission);
}
