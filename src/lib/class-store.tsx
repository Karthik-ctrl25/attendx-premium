/**
 * Class space state: announcements, polls, upcoming events, shared resources
 * and Class Representative applications.
 *
 * Local-only in V1 (IndexedDB), but every mutation is permission-checked
 * through `assertCan` so the same call sites work unchanged once a real
 * backend enforces the identical matrix.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { db } from "./db";
import {
  newId,
  pullClassSpace,
  pushAnnouncement,
  pushCrRequest,
  pushEvent,
  pushPoll,
  pushVote,
  removeRow,
  scopeOf,
} from "./cloud-sync";
import { useSession } from "./session";
import { assertCan, type Role } from "./roles";
import { useApp } from "./store";
import type {
  Announcement,
  ClassEvent,
  ClassEventKind,
  ClassResource,
  CrRequest,
  Poll,
  ReactionKind,
  ResourceKind,
} from "./types";

/** Class-space ids are UUIDs so local rows and backend rows share identity. */
const uid = (_p: string) => newId();

interface ClassState {
  announcements: Announcement[];
  polls: Poll[];
  events: ClassEvent[];
  resources: ClassResource[];
  crRequests: CrRequest[];
  react: (id: string, kind: ReactionKind) => Promise<void>;
  addAnnouncement: (input: { title: string; body: string }) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  addPoll: (input: { question: string; options: string[] }) => Promise<void>;
  vote: (pollId: string, optionId: string) => Promise<void>;
  togglePollPin: (id: string) => Promise<void>;
  deletePoll: (id: string) => Promise<void>;
  addEvent: (input: { kind: ClassEventKind; title: string; date: string; note?: string }) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addResource: (input: { kind: ResourceKind; title: string; url: string }) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  applyForCr: (reason: string) => Promise<void>;
  reviewCrRequest: (id: string, approve: boolean) => Promise<void>;
}

const Ctx = createContext<ClassState | null>(null);

export function ClassSpaceProvider({ children }: { children: ReactNode }) {
  const { meta, updateMeta } = useApp();
  const role: Role = meta.role ?? "student";
  const session = useSession();
  const userId = session?.user.id ?? null;
  const scope = scopeOf(meta);
  const scopeKey = scope ? `${scope.department}|${scope.semester}|${scope.section}` : "";
  const fire = (task: Promise<unknown>) => {
    void task.catch(() => undefined);
  };

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [resources, setResources] = useState<ClassResource[]>([]);
  const [crRequests, setCrRequests] = useState<CrRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    db.loadAll()
      .then((data) => {
        if (cancelled) return;
        setAnnouncements(data.announcements);
        setPolls(sortPolls(data.polls));
        setEvents(data.events);
        setResources(data.resources);
        setCrRequests(data.crRequests);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const sortPolls = (list: Poll[]) =>
    [...list].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.ts - a.ts);

  const sortAnnouncements = (list: Announcement[]) =>
    [...list].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.ts - a.ts);

  const react = useCallback(
    async (id: string, kind: ReactionKind) => {
      assertCan(role, "announcement.react");
      const current = announcements.find((a) => a.id === id);
      if (!current) return;
      const reactions = { ...current.reactions };
      if (current.myReaction) reactions[current.myReaction] = Math.max(0, reactions[current.myReaction] - 1);
      const myReaction = current.myReaction === kind ? null : kind;
      if (myReaction) reactions[myReaction] = (reactions[myReaction] ?? 0) + 1;
      const next: Announcement = { ...current, reactions, myReaction };
      setAnnouncements((prev) => sortAnnouncements(prev.map((a) => (a.id === id ? next : a))));
      await db.putClassRecord("announcements", next);
    },
    [announcements, role],
  );

  const addAnnouncement = useCallback(
    async ({ title, body }: { title: string; body: string }) => {
      assertCan(role, "announcement.create");
      const entry: Announcement = {
        id: uid("ann"),
        ts: Date.now(),
        title: title.trim(),
        body: body.trim(),
        authorName: meta.studentName || "Class Representative",
        authorRole: role,
        pinned: false,
        reactions: { helpful: 0, thanks: 0 },
        myReaction: null,
      };
      setAnnouncements((prev) => sortAnnouncements([entry, ...prev]));
      await db.putClassRecord("announcements", entry);
    },
    [meta.studentName, role],
  );

  const togglePin = useCallback(
    async (id: string) => {
      assertCan(role, "announcement.pin");
      const current = announcements.find((a) => a.id === id);
      if (!current) return;
      const next = { ...current, pinned: !current.pinned };
      setAnnouncements((prev) => sortAnnouncements(prev.map((a) => (a.id === id ? next : a))));
      await db.putClassRecord("announcements", next);
    },
    [announcements, role],
  );

  const deleteAnnouncement = useCallback(
    async (id: string) => {
      assertCan(role, "announcement.delete");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      await db.deleteClassRecord("announcements", id);
    },
    [role],
  );

  const addPoll = useCallback(
    async ({ question, options }: { question: string; options: string[] }) => {
      assertCan(role, "poll.create");
      const entry: Poll = {
        id: uid("poll"),
        ts: Date.now(),
        question: question.trim(),
        options: options
          .map((label) => label.trim())
          .filter(Boolean)
          .map((label) => ({ id: uid("opt"), label, votes: 0 })),
        myVote: null,
      };
      if (entry.options.length < 2) return;
      setPolls((prev) => sortPolls([entry, ...prev]));
      await db.putClassRecord("polls", entry);
    },
    [role],
  );

  const vote = useCallback(
    async (pollId: string, optionId: string) => {
      assertCan(role, "poll.vote");
      const current = polls.find((p) => p.id === pollId);
      if (!current || current.closed || current.myVote) return;
      const next: Poll = {
        ...current,
        myVote: optionId,
        options: current.options.map((o) =>
          o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
        ),
      };
      setPolls((prev) => sortPolls(prev.map((p) => (p.id === pollId ? next : p))));
      await db.putClassRecord("polls", next);
    },
    [polls, role],
  );

  const togglePollPin = useCallback(
    async (id: string) => {
      assertCan(role, "poll.pin");
      const current = polls.find((p) => p.id === id);
      if (!current) return;
      const next: Poll = { ...current, pinned: !current.pinned };
      setPolls((prev) => sortPolls(prev.map((p) => (p.id === id ? next : p))));
      await db.putClassRecord("polls", next);
    },
    [polls, role],
  );

  const deletePoll = useCallback(
    async (id: string) => {
      assertCan(role, "poll.delete");
      setPolls((prev) => prev.filter((p) => p.id !== id));
      await db.deleteClassRecord("polls", id);
    },
    [role],
  );

  const addEvent = useCallback(
    async (input: { kind: ClassEventKind; title: string; date: string; note?: string }) => {
      assertCan(role, "event.manage");
      const entry: ClassEvent = { id: uid("evt"), ...input, title: input.title.trim() };
      setEvents((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
      await db.putClassRecord("events", entry);
    },
    [role],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      assertCan(role, "event.manage");
      setEvents((prev) => prev.filter((e) => e.id !== id));
      await db.deleteClassRecord("events", id);
    },
    [role],
  );

  const addResource = useCallback(
    async (input: { kind: ResourceKind; title: string; url: string }) => {
      assertCan(role, "resource.manage");
      const entry: ClassResource = { id: uid("res"), ts: Date.now(), ...input };
      setResources((prev) => [entry, ...prev]);
      await db.putClassRecord("resources", entry);
    },
    [role],
  );

  const deleteResource = useCallback(
    async (id: string) => {
      assertCan(role, "resource.manage");
      setResources((prev) => prev.filter((r) => r.id !== id));
      await db.deleteClassRecord("resources", id);
    },
    [role],
  );

  const applyForCr = useCallback(
    async (reason: string) => {
      assertCan(role, "cr.apply");
      const entry: CrRequest = {
        id: uid("cr"),
        ts: Date.now(),
        name: meta.studentName,
        usn: meta.usn ?? "",
        reason: reason.trim(),
        status: "pending",
      };
      setCrRequests((prev) => [entry, ...prev]);
      await db.putClassRecord("crRequests", entry);
      await updateMeta({ crRequestStatus: "pending" });
    },
    [meta.studentName, meta.usn, role, updateMeta],
  );

  /** Admin-only review. A student can never grant themselves the CR role. */
  const reviewCrRequest = useCallback(
    async (id: string, approve: boolean) => {
      assertCan(role, "cr.approve");
      const current = crRequests.find((r) => r.id === id);
      if (!current) return;
      const next: CrRequest = { ...current, status: approve ? "approved" : "rejected" };
      setCrRequests((prev) => prev.map((r) => (r.id === id ? next : r)));
      await db.putClassRecord("crRequests", next);
      if (current.usn && current.usn === meta.usn) {
        await updateMeta({
          crRequestStatus: next.status,
          role: approve ? "cr" : meta.role ?? "student",
        });
      }
    },
    [crRequests, meta.role, meta.usn, role, updateMeta],
  );

  const value = useMemo<ClassState>(
    () => ({
      announcements,
      polls,
      events,
      resources,
      crRequests,
      react,
      addAnnouncement,
      togglePin,
      deleteAnnouncement,
      addPoll,
      vote,
      togglePollPin,
      deletePoll,
      addEvent,
      deleteEvent,
      addResource,
      deleteResource,
      applyForCr,
      reviewCrRequest,
    }),
    [
      announcements,
      polls,
      events,
      resources,
      crRequests,
      react,
      addAnnouncement,
      togglePin,
      deleteAnnouncement,
      addPoll,
      vote,
      togglePollPin,
      deletePoll,
      addEvent,
      deleteEvent,
      addResource,
      deleteResource,
      applyForCr,
      reviewCrRequest,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useClassSpace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useClassSpace must be used inside ClassSpaceProvider");
  return ctx;
}

/** Static, admin-editable later. Opened in the default browser, never embedded. */
export const IMPORTANT_LINKS = [
  { label: "ERP Login", url: "https://erp.cmr.edu.in/login.htm" },
  { label: "Department Website", url: "https://www.cmr.edu.in/" },
] as const;

export const ERP_LOGIN_URL = "https://erp.cmr.edu.in/login.htm";
