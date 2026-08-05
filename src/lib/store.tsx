import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";

import { db, DEFAULT_META } from "./db";
import {
  pullPrivateData,
  pullProfile,
  pullPublishedTimetable,
  pushPrivateData,
  pushProfile,
  normalizeScope,
  normalizeUsn,
  scopeOf,
  type ClassScope,
} from "./cloud-sync";

import { useSession } from "./session";
import type {
  AppMeta,
  AttendanceAction,
  AttendanceImport,
  BackupPayload,
  ClassSlot,
  HistoryEntry,
  Subject,
} from "./types";

interface AppState {
  ready: boolean;
  meta: AppMeta;
  subjects: Subject[];
  timetable: ClassSlot[];
  history: HistoryEntry[];
  imports: AttendanceImport[];
  recordImport: (entry: Omit<AttendanceImport, "id" | "ts">) => Promise<void>;
  mark: (
    code: string,
    action: AttendanceAction,
    slotId?: string,
    fallback?: { name?: string; faculty?: string },
  ) => Promise<void>;
  undo: (entryId: string) => Promise<void>;
  saveSubjects: (subjects: Subject[]) => Promise<void>;
  updateSubject: (code: string, patch: Partial<Subject>) => Promise<void>;
  resetSubject: (code: string) => Promise<void>;
  removeSubject: (code: string) => Promise<void>;
  saveTimetable: (slots: ClassSlot[]) => Promise<void>;
  completeSetup: (name: string) => Promise<void>;
  updateMeta: (patch: Partial<AppMeta>) => Promise<void>;
  exportBackup: () => BackupPayload;
  restoreBackup: (payload: BackupPayload) => Promise<void>;
  resetApp: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

let counter = 0;
const uid = () => `h_${Date.now().toString(36)}_${(counter += 1)}`;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [meta, setMeta] = useState<AppMeta>(DEFAULT_META);
  /** Always-current mirror of `meta`, so writers never compose onto a stale
   *  render snapshot. Every setMeta call must update this too. */
  const metaRef = useRef<AppMeta>(DEFAULT_META);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<ClassSlot[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [imports, setImports] = useState<AttendanceImport[]>([]);

  useEffect(() => {
    let cancelled = false;
    db.loadAll()
      .then((data) => {
        if (cancelled) return;
        metaRef.current = data.meta;
        setMeta(data.meta);
        setSubjects(data.subjects);
        setTimetable(data.timetable);
        setHistory(data.history);
        setImports(data.imports);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------- cloud sync ---
   * IndexedDB stays the offline cache. When a session exists we hydrate from
   * the backend, then push local changes back on every mutation.
   *
   * Order matters: the admin-published class timetable is the single source of
   * truth for a Department + Semester + Section. The student's own
   * `timetable_slots` rows are only a fallback for classes with no published
   * timetable — hydrating them after (or in parallel with) the published pull
   * used to overwrite the published one, which is why two students in the same
   * class could disagree.
   */
  const session = useSession();
  const userId = session?.user.id ?? null;
  const [hydrated, setHydrated] = useState(false);
  /** True while the timetable in state came from the published class table. */
  const publishedRef = useRef(false);

  const applyPublished = useCallback(async (slots: ClassSlot[]) => {
    publishedRef.current = true;
    setTimetable(slots);
    await db.replaceTimetable(slots);
  }, []);

  useEffect(() => {
    if (!ready || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ patch, hasProfile }, remote] = await Promise.all([
          pullProfile(userId),
          pullPrivateData(userId),
        ]);
        if (cancelled) return;
        if (hasProfile && patch.setupComplete) {
          // The profiles row is the single source of truth for the academic
          // scope. A non-empty remote value always wins — a stale value cached
          // on one device must never pin a student out of their class — while
          // blank remote columns fall back to whatever is stored locally.
          const prev = metaRef.current;
          const nextMeta = { ...DEFAULT_META, ...prev, ...patch } as AppMeta;
          nextMeta.department = patch.department || prev.department || "";
          nextMeta.semester = patch.semester || prev.semester || "";
          nextMeta.section = patch.section || prev.section || "";
          nextMeta.usn = patch.usn || prev.usn || "";
          nextMeta.email = patch.email || prev.email || session?.user.email || "";
          nextMeta.studentName = patch.studentName || prev.studentName || "";
          metaRef.current = nextMeta;
          setMeta(nextMeta);
          await db.putMeta(nextMeta);


          if (remote.subjects.length) {
            setSubjects(remote.subjects);
            await db.putSubjects(remote.subjects);
          }
          // Only a fallback — never allowed to clobber a published timetable.
          if (remote.timetable.length && !publishedRef.current) {
            setTimetable(remote.timetable);
            await db.replaceTimetable(remote.timetable);
          }
          if (remote.history.length) {
            const merged = remote.history.sort((a, b) => b.ts - a.ts);
            setHistory(merged);
            await Promise.all(merged.map((h) => db.putHistory(h)));
          }
          if (remote.imports.length) setImports(remote.imports);
        }
      } catch {
        /* offline — keep working from IndexedDB */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, userId]);

  /* The published timetable for the student's class. Pulled as soon as the
   * scope is known, cached in IndexedDB for instant offline navigation, and
   * kept live through Realtime so admin uploads / edits / deletes reach every
   * student in that class without a refresh, logout or reinstall. */
  const scopeKey = `${meta.department}|${meta.semester}|${meta.section}`;
  useEffect(() => {
    if (!ready || !userId) return;
    const scope = scopeOf(metaRef.current);
    if (!scope) return;
    let cancelled = false;

    const sync = async () => {
      try {
        const published = await pullPublishedTimetable(scope);
        if (cancelled) return;
        if (published.length) {
          await applyPublished(published);
        } else if (publishedRef.current) {
          // Timetable was unpublished — drop the cached copy.
          publishedRef.current = false;
          setTimetable([]);
          await db.replaceTimetable([]);
        }
      } catch {
        /* offline — keep the cached timetable */
      }
    };

    void sync();

    let debounce: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel(`class-timetable:${scopeKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_timetable_slots" },
        (payload: { new?: unknown; old?: unknown }) => {
          const row = (payload.new ?? payload.old) as Partial<ClassScope> | null;
          if (
            row &&
            row.department &&
            (row.department !== scope.department ||
              row.semester !== scope.semester ||
              row.section !== scope.section)
          ) {
            return;
          }
          clearTimeout(debounce);
          debounce = setTimeout(() => void sync(), 400);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId, scopeKey, applyPublished]);

  useEffect(() => {
    if (!userId || !hydrated || !meta.setupComplete) return;
    const t = setTimeout(() => {
      pushProfile(userId, meta)
        .then(() =>
          pushPrivateData(userId, {
            subjects,
            // A published timetable belongs to the class, not the student —
            // mirroring it into private rows resurrects stale slots later.
            timetable: publishedRef.current ? [] : timetable,
            history,
            imports,
          }),
        )
        .catch(() => undefined);
    }, 800);
    return () => clearTimeout(t);
  }, [userId, hydrated, meta, subjects, timetable, history, imports]);



  const saveSubjects = useCallback(async (next: Subject[]) => {
    setSubjects(next);
    await db.putSubjects(next);
  }, []);

  const recordImport = useCallback(
    async (entry: Omit<AttendanceImport, "id" | "ts">) => {
      const full: AttendanceImport = { ...entry, id: uid(), ts: Date.now() };
      setImports((prev) => [full, ...prev]);
      await db.putImport(full);
    },
    [],
  );

  const mark = useCallback(
    async (
      code: string,
      action: AttendanceAction,
      slotId?: string,
      fallback?: { name?: string; faculty?: string },
    ) => {
      const existing = subjects.find((s) => s.code === code);
      // A published timetable can contain a subject the student hasn't imported
      // yet — start tracking it instead of refusing the tap.
      const subject: Subject = existing ?? {
        code,
        name: fallback?.name || code,
        faculty: fallback?.faculty || "",
        present: 0,
        absent: 0,
        total: 0,
      };
      const updated: Subject = {
        ...subject,
        present: subject.present + (action === "present" ? 1 : 0),
        absent: subject.absent + (action === "absent" ? 1 : 0),
        total: subject.total + 1,
      };
      const nextSubjects = existing
        ? subjects.map((s) => (s.code === code ? updated : s))
        : [...subjects, updated];
      const entry: HistoryEntry = {
        id: uid(),
        ts: Date.now(),
        code,
        name: subject.name,
        action,
        slotId,
      };
      setSubjects(nextSubjects);
      setHistory((h) => [entry, ...h]);
      await Promise.all([db.putSubjects([updated]), db.putHistory(entry)]);
    },
    [subjects],
  );


  const undo = useCallback(
    async (entryId: string) => {
      const entry = history.find((h) => h.id === entryId);
      if (!entry || entry.undone) return;
      const subject = subjects.find((s) => s.code === entry.code);
      const tasks: Promise<unknown>[] = [];
      if (subject) {
        const updated: Subject = {
          ...subject,
          present: Math.max(0, subject.present - (entry.action === "present" ? 1 : 0)),
          absent: Math.max(0, subject.absent - (entry.action === "absent" ? 1 : 0)),
          total: Math.max(0, subject.total - 1),
        };
        setSubjects((prev) => prev.map((s) => (s.code === entry.code ? updated : s)));
        tasks.push(db.putSubjects([updated]));
      }
      setHistory((prev) => prev.filter((h) => h.id !== entryId));
      tasks.push(db.deleteHistory(entryId));
      await Promise.all(tasks);
    },
    [history, subjects],
  );

  const updateSubject = useCallback(
    async (code: string, patch: Partial<Subject>) => {
      const subject = subjects.find((s) => s.code === code);
      if (!subject) return;
      const updated = { ...subject, ...patch };
      setSubjects((prev) => prev.map((s) => (s.code === code ? updated : s)));
      await db.putSubjects([updated]);
    },
    [subjects],
  );

  const resetSubject = useCallback(
    async (code: string) => {
      await updateSubject(code, { present: 0, absent: 0, total: 0 });
      setHistory((prev) => prev.filter((h) => h.code !== code));
      await db.clearHistoryFor(code);
    },
    [updateSubject],
  );

  const removeSubject = useCallback(async (code: string) => {
    setSubjects((prev) => prev.filter((s) => s.code !== code));
    setHistory((prev) => prev.filter((h) => h.code !== code));
    await Promise.all([db.deleteSubject(code), db.clearHistoryFor(code)]);
  }, []);

  const saveTimetable = useCallback(async (slots: ClassSlot[]) => {
    setTimetable(slots);
    await db.replaceTimetable(slots);
  }, []);

  /* Both writers go through patchMeta, which composes onto a ref mirror
   * instead of the render-scoped `meta` snapshot. Onboarding calls
   * updateMeta() then completeSetup() in the same tick; with the old stale
   * closure the second call re-wrote the pre-update object and wiped USN,
   * email, department, semester and section. */
  const patchMeta = useCallback(async (patch: Partial<AppMeta>) => {
    const next: AppMeta = { ...metaRef.current, ...patch };
    // Scope + USN are matched byte-for-byte against the backend, so they are
    // normalised the moment they enter state (no stray/hidden whitespace).
    if (next.department || next.semester || next.section) {
      const s = normalizeScope(next);
      next.department = s.department;
      next.semester = s.semester;
      next.section = s.section;
    }
    if (next.usn) next.usn = normalizeUsn(next.usn);
    metaRef.current = next;
    setMeta(next);
    await db.putMeta(next);
  }, []);

  const completeSetup = useCallback(
    (name: string) => patchMeta({ studentName: name, setupComplete: true }),
    [patchMeta],
  );

  const updateMeta = useCallback(
    (patch: Partial<AppMeta>) => patchMeta(patch),
    [patchMeta],
  );

  const exportBackup = useCallback(
    (): BackupPayload => ({
      version: 1,
      exportedAt: Date.now(),
      meta,
      subjects,
      timetable,
      history,
    }),
    [meta, subjects, timetable, history],
  );

  const restoreBackup = useCallback(async (payload: BackupPayload) => {
    const nextMeta = { ...DEFAULT_META, ...payload.meta, setupComplete: true };
    metaRef.current = nextMeta;
    setMeta(nextMeta);
    setSubjects(payload.subjects ?? []);
    setTimetable(payload.timetable ?? []);
    setHistory((payload.history ?? []).sort((a, b) => b.ts - a.ts));
    await db.reset();
    await Promise.all([
      db.putMeta(nextMeta),
      db.putSubjects(payload.subjects ?? []),
      db.replaceTimetable(payload.timetable ?? []),
      ...(payload.history ?? []).map((h) => db.putHistory(h)),
    ]);
  }, []);

  const resetApp = useCallback(async () => {
    const fresh = { ...DEFAULT_META, createdAt: Date.now() };
    metaRef.current = fresh;
    setMeta(fresh);
    setSubjects([]);
    setTimetable([]);
    setHistory([]);
    setImports([]);
    await db.reset();
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      meta,
      subjects,
      timetable,
      history,
      imports,
      recordImport,
      mark,
      undo,
      saveSubjects,
      updateSubject,
      resetSubject,
      removeSubject,
      saveTimetable,
      completeSetup,
      updateMeta,
      exportBackup,
      restoreBackup,
      resetApp,
    }),
    [
      ready,
      meta,
      subjects,
      timetable,
      history,
      imports,
      recordImport,
      mark,
      undo,
      saveSubjects,
      updateSubject,
      resetSubject,
      removeSubject,
      saveTimetable,
      completeSetup,
      updateMeta,
      exportBackup,
      restoreBackup,
      resetApp,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppDataProvider");
  return ctx;
}
