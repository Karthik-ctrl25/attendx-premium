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

import { db, DEFAULT_META } from "./db";
import {
  pullPrivateData,
  pullProfile,
  pullPublishedTimetable,
  pushPrivateData,
  pushProfile,
  scopeOf,
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
   * the backend first (remote wins for an already-set-up account), then push
   * local changes back on every mutation.
   */
  const session = useSession();
  const userId = session?.user.id ?? null;
  const [hydrated, setHydrated] = useState(false);

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
          // Remote wins, but never let blank remote fields wipe the locally
          // saved identity/academic scope — that scope is what the published
          // timetable query filters on. Any local value that fills a blank
          // remote column is backfilled by the push effect below.
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
          console.info("[AttendX] profile fetched", {
            usn: nextMeta.usn,
            email: nextMeta.email,
            department: nextMeta.department,
            semester: nextMeta.semester,
            section: nextMeta.section,
            backfillNeeded:
              !patch.usn || !patch.department || !patch.semester || !patch.section,
          });
          if (remote.subjects.length) {
            setSubjects(remote.subjects);
            await db.putSubjects(remote.subjects);
          }
          if (remote.timetable.length) {
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

  /* An admin-published class timetable always wins over the local one. Runs
   * whenever the student's Department / Semester / Section is known, and the
   * result is cached in IndexedDB so navigation stays instant offline. */
  const scopeKey = `${meta.department}|${meta.semester}|${meta.section}`;
  useEffect(() => {
    if (!ready || !userId) return;
    const scope = scopeOf(meta);
    if (!scope) return;
    let cancelled = false;
    pullPublishedTimetable(scope)
      .then(async (published) => {
        if (cancelled || !published.length) return;
        setTimetable(published);
        await db.replaceTimetable(published);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId, scopeKey]);


  useEffect(() => {
    if (!userId || !hydrated || !meta.setupComplete) return;
    const t = setTimeout(() => {
      pushProfile(userId, meta)
        .then(() => pushPrivateData(userId, { subjects, timetable, history, imports }))
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
