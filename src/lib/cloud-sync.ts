/**
 * Cloud sync — IndexedDB stays the offline cache, the backend is the source of
 * truth once the student is signed in. Every helper is best-effort: if the
 * network or the session is unavailable the app keeps working offline.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

import type {
  Announcement,
  AppMeta,
  AttendanceImport,
  ClassEvent,
  ClassSlot,
  CrRequest,
  HistoryEntry,
  Poll,
  Subject,
} from "./types";
import type { Role } from "./roles";

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export interface ClassScope {
  department: string;
  semester: string;
  section: string;
}

export const scopeOf = (meta: AppMeta): ClassScope | null =>
  meta.department && meta.semester && meta.section
    ? { department: meta.department, semester: meta.semester, section: meta.section }
    : null;

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/* ---------------------------------------------------------------- profile */

export async function pullProfile(
  userId: string,
): Promise<{ patch: Partial<AppMeta>; hasProfile: boolean }> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("roles").select("role").eq("user_id", userId),
  ]);
  if (!profile) return { patch: {}, hasProfile: false };
  const ranked: Role[] = ["admin", "cr", "student"];
  const owned = (roles ?? []).map((r) => r.role as Role);
  const role = ranked.find((r) => owned.includes(r)) ?? "student";
  return {
    hasProfile: true,
    patch: {
      studentName: profile.student_name || "",
      usn: profile.usn || "",
      email: profile.email || "",
      photo: profile.photo ?? "",
      department: profile.department || "",
      semester: profile.semester || "",
      section: profile.section || "",
      university: profile.university,
      theme: profile.theme === "dark" ? "dark" : "light",
      reminderEnabled: profile.reminder_enabled,
      reminderTime: profile.reminder_time,
      lastVerifiedAt: profile.last_verified_at ? Date.parse(profile.last_verified_at) : 0,
      setupComplete: profile.setup_complete,
      createdAt: Date.parse(profile.created_at),
      role,
    },
  };
}

export async function pushProfile(userId: string, meta: AppMeta) {
  await supabase.from("profiles").upsert({
    id: userId,
    student_name: meta.studentName ?? "",
    usn: meta.usn ?? "",
    email: meta.email ?? "",
    photo: meta.photo ?? null,
    department: meta.department ?? "",
    semester: meta.semester ?? "",
    section: meta.section ?? "",
    university: meta.university || "CMR University",
    theme: meta.theme === "dark" ? "dark" : "light",
    reminder_enabled: meta.reminderEnabled !== false,
    reminder_time: meta.reminderTime || "19:00",
    last_verified_at: meta.lastVerifiedAt ? new Date(meta.lastVerifiedAt).toISOString() : null,
    setup_complete: Boolean(meta.setupComplete),
    updated_at: new Date().toISOString(),
  });
}

/* ------------------------------------------------------------ private data */

export interface CloudSnapshot {
  subjects: Subject[];
  timetable: ClassSlot[];
  history: HistoryEntry[];
  imports: AttendanceImport[];
}

export async function pullPrivateData(userId: string): Promise<CloudSnapshot> {
  const [subjects, slots, history, imports] = await Promise.all([
    supabase.from("subjects").select("*").eq("user_id", userId),
    supabase.from("timetable_slots").select("*").eq("user_id", userId),
    supabase.from("attendance_history").select("*").eq("user_id", userId).order("ts", { ascending: false }),
    supabase.from("attendance_imports").select("*").eq("user_id", userId).order("ts", { ascending: false }),
  ]);
  return {
    subjects: (subjects.data ?? []).map((r) => ({
      code: r.code,
      name: r.name,
      faculty: r.faculty,
      present: r.present,
      absent: r.absent,
      total: r.total,
    })) as Subject[],
    timetable: (slots.data ?? []).map((r) => ({
      id: r.local_id,
      day: r.day,
      start: r.start_time,
      end: r.end_time,
      code: r.code,
      name: r.name,
      faculty: r.faculty,
      room: r.room,
      session: r.session,
    })) as ClassSlot[],
    history: (history.data ?? []).map((r) => r.payload as unknown as HistoryEntry),
    imports: (imports.data ?? []).map((r) => r.payload as unknown as AttendanceImport),
  };
}

export async function pushPrivateData(userId: string, snap: CloudSnapshot) {
  const tasks: PromiseLike<unknown>[] = [];
  if (snap.subjects.length) {
    tasks.push(
      supabase.from("subjects").upsert(
        snap.subjects.map((s) => ({
          user_id: userId,
          code: s.code,
          name: s.name ?? "",
          faculty: s.faculty ?? "",
          present: s.present,
          absent: s.absent,
          total: s.total,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,code" },
      ),
    );
  }
  if (snap.timetable.length) {
    tasks.push(
      supabase.from("timetable_slots").upsert(
        snap.timetable.map((s) => ({
          user_id: userId,
          local_id: s.id,
          day: s.day,
          start_time: s.start,
          end_time: s.end,
          code: s.code,
          name: s.name,
          faculty: s.faculty ?? "",
          room: s.room ?? "",
          session: String(s.session ?? ""),
        })),
        { onConflict: "user_id,local_id" },
      ),
    );
  }
  if (snap.history.length) {
    tasks.push(
      supabase.from("attendance_history").upsert(
        snap.history.slice(0, 500).map((h) => ({
          user_id: userId,
          local_id: h.id,
          subject_code: h.code,
          status: h.action,
          ts: new Date(h.ts).toISOString(),
          marked_on: new Date(h.ts).toISOString().slice(0, 10),
          payload: h as unknown as Json,
        })),
        { onConflict: "user_id,local_id" },
      ),
    );
  }
  if (snap.imports.length) {
    tasks.push(
      supabase.from("attendance_imports").upsert(
        snap.imports.slice(0, 200).map((i) => ({
          user_id: userId,
          local_id: i.id,
          ts: new Date(i.ts).toISOString(),
          fingerprint: String((i as { fileHash?: string }).fileHash ?? ""),
          payload: i as unknown as Json,
        })),
        { onConflict: "user_id,local_id" },
      ),
    );
  }
  await Promise.all(tasks);
}

/* ------------------------------------------------------------- class space */

export interface ClassSnapshot {
  announcements: Announcement[];
  polls: Poll[];
  events: ClassEvent[];
  crRequests: CrRequest[];
}

const POLL_OPTIONS = ["Yes", "No", "Maybe"];

export async function pullClassSpace(
  userId: string,
  scope: ClassScope,
): Promise<ClassSnapshot> {
  const match = scope as unknown as Record<string, string>;
  const [ann, polls, events, crs] = await Promise.all([
    supabase.from("announcements").select("*").match(match).order("created_at", { ascending: false }),
    supabase.from("polls").select("*").match(match).order("created_at", { ascending: false }),
    supabase.from("events").select("*").match(match).order("date", { ascending: true }),
    supabase.from("cr_requests").select("*").match(match).order("created_at", { ascending: false }),
  ]);
  const pollIds = (polls.data ?? []).map((p) => p.id);
  const votes = pollIds.length
    ? (await supabase.from("poll_votes").select("*").in("poll_id", pollIds)).data ?? []
    : [];

  return {
    announcements: (ann.data ?? []).map((a) => ({
      id: a.id,
      ts: Date.parse(a.created_at),
      title: a.title,
      body: a.body,
      authorName: "Class",
      authorRole: "cr" as Role,
      pinned: a.pinned,
      reactions: { helpful: 0, thanks: 0 },
      myReaction: null,
    })) as Announcement[],
    polls: (polls.data ?? []).map((p) => {
      const mine = votes.find((v) => v.poll_id === p.id && v.user_id === userId);
      return {
        id: p.id,
        ts: Date.parse(p.created_at),
        question: p.question,
        pinned: p.pinned,
        options: POLL_OPTIONS.map((label) => ({
          id: `${p.id}:${label}`,
          label,
          votes: votes.filter((v) => v.poll_id === p.id && v.choice === label).length,
        })),
        myVote: mine ? `${p.id}:${mine.choice}` : null,
      };
    }) as Poll[],
    events: (events.data ?? []).map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      date: e.date ?? "",
      note: e.notes,
    })) as ClassEvent[],
    crRequests: (crs.data ?? []).map((r) => ({
      id: r.id,
      ts: Date.parse(r.created_at),
      name: r.name,
      usn: r.usn,
      reason: r.reason,
      status: r.status,
    })) as CrRequest[],
  };
}

export async function pushAnnouncement(userId: string, scope: ClassScope, a: Announcement) {
  await supabase.from("announcements").upsert({
    id: a.id,
    author_id: userId,
    ...scope,
    title: a.title,
    body: a.body,
    pinned: Boolean(a.pinned),
  });
}

export async function pushPoll(userId: string, scope: ClassScope, p: Poll) {
  await supabase.from("polls").upsert({
    id: p.id,
    author_id: userId,
    ...scope,
    question: p.question,
    pinned: Boolean(p.pinned),
  });
}

export async function pushVote(userId: string, pollId: string, choice: string) {
  await supabase
    .from("poll_votes")
    .upsert({ poll_id: pollId, user_id: userId, choice }, { onConflict: "poll_id,user_id" });
}

export async function pushEvent(userId: string, scope: ClassScope, e: ClassEvent) {
  await supabase.from("events").upsert({
    id: e.id,
    author_id: userId,
    ...scope,
    title: e.title,
    kind: String(e.kind),
    date: e.date || null,
    notes: e.note ?? "",
  });
}

export async function pushCrRequest(userId: string, scope: ClassScope, r: CrRequest) {
  await supabase.from("cr_requests").upsert({
    id: r.id,
    user_id: userId,
    ...scope,
    name: r.name,
    usn: r.usn,
    reason: r.reason,
    status: r.status,
  });
}

export async function removeRow(
  table: "announcements" | "polls" | "events" | "cr_requests",
  id: string,
) {
  await supabase.from(table).delete().eq("id", id);
}

/* ------------------------------------------------ published class timetable */

/**
 * Timetable published by an admin for the student's class. When present it is
 * the source of truth, so students automatically receive updates.
 */
export async function pullPublishedTimetable(scope: ClassScope): Promise<ClassSlot[]> {
  const { data } = await supabase
    .from("class_timetable_slots")
    .select("*")
    .eq("department", scope.department)
    .eq("semester", scope.semester)
    .eq("section", scope.section)
    .eq("published", true);
  return (data ?? []).map((r) => ({
    id: r.id,
    day: r.day,
    start: r.start_time,
    end: r.end_time,
    code: r.code,
    name: r.name,
    faculty: r.faculty,
    room: r.room,
    session: (r.session === "Lab" ? "Lab" : "Theory") as ClassSlot["session"],
  }));
}
