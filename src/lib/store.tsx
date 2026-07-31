import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { db, DEFAULT_META } from "./db";
import type {
  AppMeta,
  AttendanceAction,
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
  mark: (code: string, action: AttendanceAction, slotId?: string) => Promise<void>;
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<ClassSlot[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    db.loadAll()
      .then((data) => {
        if (cancelled) return;
        setMeta(data.meta);
        setSubjects(data.subjects);
        setTimetable(data.timetable);
        setHistory(data.history);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const saveSubjects = useCallback(async (next: Subject[]) => {
    setSubjects(next);
    await db.putSubjects(next);
  }, []);

  const mark = useCallback(
    async (code: string, action: AttendanceAction, slotId?: string) => {
      const subject = subjects.find((s) => s.code === code);
      if (!subject) return;
      const updated: Subject = {
        ...subject,
        present: subject.present + (action === "present" ? 1 : 0),
        absent: subject.absent + (action === "absent" ? 1 : 0),
        total: subject.total + 1,
      };
      const nextSubjects = subjects.map((s) => (s.code === code ? updated : s));
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

  const completeSetup = useCallback(
    async (name: string) => {
      const next: AppMeta = { ...meta, studentName: name, setupComplete: true };
      setMeta(next);
      await db.putMeta(next);
    },
    [meta],
  );

  const updateMeta = useCallback(
    async (patch: Partial<AppMeta>) => {
      const next: AppMeta = { ...meta, ...patch };
      setMeta(next);
      await db.putMeta(next);
    },
    [meta],
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
    setMeta({ ...DEFAULT_META, createdAt: Date.now() });
    setSubjects([]);
    setTimetable([]);
    setHistory([]);
    await db.reset();
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      meta,
      subjects,
      timetable,
      history,
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
