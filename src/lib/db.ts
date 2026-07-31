import { openDB, type IDBPDatabase } from "idb";

import type { AppMeta, AttendanceImport, ClassSlot, HistoryEntry, Subject } from "./types";

const DB_NAME = "attendx";
const DB_VERSION = 2;

const DEFAULT_META: AppMeta = {
  setupComplete: false,
  studentName: "",
  university: "CMR University",
  createdAt: Date.now(),
  photo: "",
  usn: "",
  department: "",
  semester: "",
  section: "",
  email: "",
  reduceMotion: false,
  authProvider: "local",
  reminderEnabled: true,
  reminderTime: "19:00",
  lastReminderDate: "",
  lastVerifiedAt: 0,
};



let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB unavailable");
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("subjects")) {
          db.createObjectStore("subjects", { keyPath: "code" });
        }
        if (!db.objectStoreNames.contains("timetable")) {
          db.createObjectStore("timetable", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("history")) {
          db.createObjectStore("history", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta");
        }
        if (!db.objectStoreNames.contains("imports")) {
          db.createObjectStore("imports", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export const db = {
  async loadAll() {
    const conn = await getDB();
    const [subjects, timetable, history, meta, imports] = await Promise.all([
      conn.getAll("subjects") as Promise<Subject[]>,
      conn.getAll("timetable") as Promise<ClassSlot[]>,
      conn.getAll("history") as Promise<HistoryEntry[]>,
      conn.get("meta", "app") as Promise<AppMeta | undefined>,
      conn.getAll("imports") as Promise<AttendanceImport[]>,
    ]);
    return {
      subjects,
      timetable,
      history: history.sort((a, b) => b.ts - a.ts),
      meta: { ...DEFAULT_META, ...(meta ?? {}) },
      imports: imports.sort((a, b) => b.ts - a.ts),
    };
  },

  async putImport(entry: AttendanceImport) {
    const conn = await getDB();
    await conn.put("imports", entry);
  },


  async putSubjects(subjects: Subject[]) {
    const conn = await getDB();
    const tx = conn.transaction("subjects", "readwrite");
    await Promise.all(subjects.map((s) => tx.store.put(s)));
    await tx.done;
  },

  async deleteSubject(code: string) {
    const conn = await getDB();
    await conn.delete("subjects", code);
  },

  async replaceTimetable(slots: ClassSlot[]) {
    const conn = await getDB();
    const tx = conn.transaction("timetable", "readwrite");
    await tx.store.clear();
    await Promise.all(slots.map((s) => tx.store.put(s)));
    await tx.done;
  },

  async putHistory(entry: HistoryEntry) {
    const conn = await getDB();
    await conn.put("history", entry);
  },

  async deleteHistory(id: string) {
    const conn = await getDB();
    await conn.delete("history", id);
  },

  async clearHistoryFor(code: string) {
    const conn = await getDB();
    const tx = conn.transaction("history", "readwrite");
    const all = (await tx.store.getAll()) as HistoryEntry[];
    await Promise.all(all.filter((h) => h.code === code).map((h) => tx.store.delete(h.id)));
    await tx.done;
  },

  async putMeta(meta: AppMeta) {
    const conn = await getDB();
    await conn.put("meta", meta, "app");
  },

  async reset() {
    const conn = await getDB();
    const tx = conn.transaction(
      ["subjects", "timetable", "history", "meta", "imports"],
      "readwrite",
    );
    await Promise.all([
      tx.objectStore("subjects").clear(),
      tx.objectStore("timetable").clear(),
      tx.objectStore("history").clear(),
      tx.objectStore("meta").clear(),
      tx.objectStore("imports").clear(),
    ]);
    await tx.done;
  },

};

export { DEFAULT_META };
