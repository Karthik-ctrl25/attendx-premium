/**
 * Admin server functions.
 *
 * Every function verifies the caller's admin role SERVER-SIDE with the
 * caller's own bearer token (`has_role`) before touching data. The client can
 * never elevate itself: RLS additionally restricts each table to admins.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import type {
  AdminAnalytics,
  AdminAnnouncement,
  AdminOverview,
  AdminPoll,
  AdminStudent,
  ClassScopeInput,
  CrRequestRow,
  TimetableSlotRow,
} from "./admin.types";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  // Return a real 403 instead of letting a plain Error bubble up as a 500
  // ("Internal Server Error") page.
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}


const count = async (supabase: any, table: string, filters?: Record<string, unknown>) => {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  for (const [k, v] of Object.entries(filters ?? {})) q = q.eq(k, v);
  const { count: c } = await q;
  return c ?? 0;
};

/* ------------------------------------------------------------- overview */

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await assertAdmin(context as Ctx);
    const supabase = (context as Ctx).supabase;

    const [{ data: profiles }, announcements, polls, imports, pendingCr] = await Promise.all([
      supabase.from("profiles").select("department, semester, section"),
      count(supabase, "announcements"),
      count(supabase, "polls"),
      count(supabase, "attendance_imports"),
      count(supabase, "cr_requests", { status: "pending" }),
    ]);

    const rows = (profiles ?? []) as { department: string; semester: string; section: string }[];
    const uniq = (key: "department" | "semester" | "section") =>
      new Set(rows.map((r) => r[key]).filter(Boolean)).size;

    return {
      students: rows.length,
      departments: uniq("department"),
      semesters: uniq("semester"),
      sections: uniq("section"),
      announcements,
      polls,
      imports,
      pendingCr,
    };
  });

/* ------------------------------------------------------------- students */

export const adminListStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<ClassScopeInput> & { search?: string }) => input ?? {})
  .handler(async ({ context, data }): Promise<AdminStudent[]> => {
    await assertAdmin(context as Ctx);
    const supabase = (context as Ctx).supabase;
    let q = supabase
      .from("profiles")
      .select(
        "id, student_name, usn, email, photo, department, semester, section, setup_complete, disabled, created_at",
      )
      .order("student_name", { ascending: true })
      .limit(500);
    if (data.department) q = q.eq("department", data.department);
    if (data.semester) q = q.eq("semester", data.semester);
    if (data.section) q = q.eq("section", data.section);
    const term = (data.search ?? "").trim();
    if (term) q = q.or(`student_name.ilike.%${term}%,usn.ilike.%${term}%,email.ilike.%${term}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []) as AdminStudent[];
  });

export const adminSetStudentDisabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; disabled: boolean }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const { error } = await (context as Ctx).supabase
      .from("profiles")
      .update({ disabled: data.disabled })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const adminResetOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const { error } = await (context as Ctx).supabase
      .from("profiles")
      .update({ setup_complete: false })
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

/* ------------------------------------------------------------ timetable */

export const adminListTimetable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ClassScopeInput) => input)
  .handler(async ({ context, data }): Promise<TimetableSlotRow[]> => {
    await assertAdmin(context as Ctx);
    const { data: rows, error } = await (context as Ctx).supabase
      .from("class_timetable_slots")
      .select("*")
      .eq("department", data.department)
      .eq("semester", data.semester)
      .eq("section", data.section)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw error;
    return (rows ?? []) as TimetableSlotRow[];
  });

export const adminAddTimetableSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: ClassScopeInput & {
      day: number;
      start_time: string;
      end_time: string;
      code: string;
      name: string;
      faculty: string;
      room: string;
      session: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const { error } = await (context as Ctx).supabase.from("class_timetable_slots").insert(data);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteTimetableSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const { error } = await (context as Ctx).supabase
      .from("class_timetable_slots")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminPublishTimetable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ClassScopeInput & { published: boolean }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const { error } = await (context as Ctx).supabase
      .from("class_timetable_slots")
      .update({ published: data.published })
      .eq("department", data.department)
      .eq("semester", data.semester)
      .eq("section", data.section);
    if (error) throw error;
    return { ok: true };
  });

/* -------------------------------------------------------- announcements */

export const adminListAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAnnouncement[]> => {
    await assertAdmin(context as Ctx);
    const { data, error } = await (context as Ctx).supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as AdminAnnouncement[];
  });

export const adminSaveAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: Partial<ClassScopeInput> & { id?: string; title: string; body: string }) => input,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const ctx = context as Ctx;
    if (data.id) {
      const { error } = await ctx.supabase
        .from("announcements")
        .update({ title: data.title, body: data.body })
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true };
    }
    const { error } = await ctx.supabase.from("announcements").insert({
      author_id: ctx.userId,
      department: data.department ?? "",
      semester: data.semester ?? "",
      section: data.section ?? "",
      title: data.title,
      body: data.body,
    });
    if (error) throw error;
    return { ok: true };
  });

export const adminSetAnnouncementPinned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; pinned: boolean }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const { error } = await (context as Ctx).supabase
      .from("announcements")
      .update({ pinned: data.pinned })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const { error } = await (context as Ctx).supabase
      .from("announcements")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ------------------------------------------------------------------ polls */

export const adminListPolls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPoll[]> => {
    await assertAdmin(context as Ctx);
    const supabase = (context as Ctx).supabase;
    const [{ data: polls, error }, { data: votes }] = await Promise.all([
      supabase
        .from("polls")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("poll_votes").select("poll_id, choice"),
    ]);
    if (error) throw error;
    const tally = new Map<string, Record<string, number>>();
    for (const v of (votes ?? []) as { poll_id: string; choice: string }[]) {
      const bucket = tally.get(v.poll_id) ?? {};
      bucket[v.choice] = (bucket[v.choice] ?? 0) + 1;
      tally.set(v.poll_id, bucket);
    }
    return ((polls ?? []) as AdminPoll[]).map((p) => ({ ...p, votes: tally.get(p.id) ?? {} }));
  });

export const adminUpdatePoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; pinned?: boolean; closed?: boolean }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const patch: Record<string, boolean> = {};
    if (typeof data.pinned === "boolean") patch['pinned'] = data.pinned;
    if (typeof data.closed === "boolean") patch['closed'] = data.closed;
    const { error } = await (context as Ctx).supabase.from("polls").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeletePoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const { error } = await (context as Ctx).supabase.from("polls").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ------------------------------------------------------------ CR requests */

export const adminListCrRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CrRequestRow[]> => {
    await assertAdmin(context as Ctx);
    const { data, error } = await (context as Ctx).supabase
      .from("cr_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as CrRequestRow[];
  });

export const adminReviewCrRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; userId: string; approve: boolean }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const supabase = (context as Ctx).supabase;
    const { error } = await supabase
      .from("cr_requests")
      .update({ status: data.approve ? "approved" : "rejected" })
      .eq("id", data.id);
    if (error) throw error;
    if (data.approve) {
      const { error: roleError } = await supabase
        .from("roles")
        .insert({ user_id: data.userId, role: "cr" });
      if (roleError && !`${roleError.message}`.includes("duplicate")) throw roleError;
    }
    return { ok: true };
  });

/* -------------------------------------------------------------- analytics */

export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAnalytics> => {
    await assertAdmin(context as Ctx);
    const supabase = (context as Ctx).supabase;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ data: profiles }, { data: imports }, { count: dau }] = await Promise.all([
      supabase.from("profiles").select("department, semester"),
      supabase.from("attendance_imports").select("payload, ts").limit(1000),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", since),
    ]);

    const rows = (profiles ?? []) as { department: string; semester: string }[];
    const bucket = (key: "department" | "semester") => {
      const map = new Map<string, number>();
      for (const r of rows) {
        const k = r[key] || "—";
        map.set(k, (map.get(k) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    };

    const importRows = (imports ?? []) as { payload: any }[];
    const clean = importRows.filter((i) => {
      const subjects = Array.isArray(i.payload?.subjects) ? i.payload.subjects : [];
      return subjects.length > 0 && !subjects.some((s: any) => s?.flagged);
    }).length;

    return {
      totalUsers: rows.length,
      dailyActive: dau ?? 0,
      imports: importRows.length,
      ocrSuccessRate: importRows.length ? Math.round((clean / importRows.length) * 100) : 0,
      byDepartment: bucket("department"),
      bySemester: bucket("semester"),
    };
  });

/* --------------------------------------------------- timetable (update) */

export const adminUpdateTimetableSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      day: number;
      start_time: string;
      end_time: string;
      code: string;
      name: string;
      faculty: string;
      room: string;
      session: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const { id, ...patch } = data;
    const { error } = await (context as Ctx).supabase
      .from("class_timetable_slots")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

/** Distinct Department → Semester → Section combinations that exist today. */
export const adminListClassScopes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ClassScopeInput[]> => {
    await assertAdmin(context as Ctx);
    const supabase = (context as Ctx).supabase;
    const [{ data: profiles }, { data: slots }] = await Promise.all([
      supabase.from("profiles").select("department, semester, section"),
      supabase.from("class_timetable_slots").select("department, semester, section"),
    ]);
    const seen = new Map<string, ClassScopeInput>();
    for (const r of [...(profiles ?? []), ...(slots ?? [])] as ClassScopeInput[]) {
      if (!r.department || !r.semester || !r.section) continue;
      seen.set(`${r.department}|${r.semester}|${r.section}`, r);
    }
    return [...seen.values()].sort(
      (a, b) =>
        a.department.localeCompare(b.department) ||
        a.semester.localeCompare(b.semester) ||
        a.section.localeCompare(b.section),
    );
  });
