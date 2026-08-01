import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  ExternalLink,
  FileText,
  Heart,
  Link2,
  Megaphone,
  Pin,
  Plus,
  ThumbsUp,
  Trash2,
  Vote,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IMPORTANT_LINKS, useClassSpace } from "@/lib/class-store";
import { can, type Role } from "@/lib/roles";
import { useApp } from "@/lib/store";
import type { ClassEventKind, ResourceKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/class")({
  head: () => ({
    meta: [
      { title: "Class — AttendX" },
      {
        name: "description",
        content:
          "Class announcements, polls, upcoming assignments and exams, important links and shared resources for your CMR University section.",
      },
      { property: "og:title", content: "Class — AttendX" },
      {
        property: "og:description",
        content: "Announcements, polls, upcoming dates and resources for your section.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClassPage,
});

const EVENT_KINDS: ClassEventKind[] = ["Assignment", "Seminar", "Lab Exam", "IA"];
const RESOURCE_KINDS: ResourceKind[] = ["PDF", "PPT", "Link"];

function Empty({ text }: { text: string }) {
  return (
    <GlassCard className="p-6 text-center text-sm text-muted-foreground">{text}</GlassCard>
  );
}

function Composer({
  label,
  children,
  onSubmit,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="secondary" className="w-full rounded-2xl" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> {label}
      </Button>
    );
  }
  return (
    <GlassCard className="space-y-2 p-4">
      {children}
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="rounded-2xl"
          disabled={disabled}
          onClick={() => {
            onSubmit();
            setOpen(false);
          }}
        >
          Post
        </Button>
        <Button variant="secondary" className="rounded-2xl" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </GlassCard>
  );
}

function ClassPage() {
  const { meta } = useApp();
  const role: Role = meta.role ?? "student";

  return (
    <div className="w-full min-w-0 space-y-6 pb-2">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Class</h1>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {[meta.department, meta.semester && `Semester ${meta.semester}`, meta.section && `Section ${meta.section}`]
            .filter(Boolean)
            .join(" · ") || meta.university}
        </p>
      </header>

      <Announcements role={role} />
      <Polls role={role} />
      <Upcoming role={role} />
      <ImportantLinks />
      <Resources role={role} />
    </div>
  );
}

function Announcements({ role }: { role: Role }) {
  const { announcements, addAnnouncement, react, togglePin, deleteAnnouncement } = useClassSpace();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <section className="space-y-3">
      <SectionTitle title="📢 Announcements" subtitle="From your CR and admins" />
      {can(role, "announcement.create") ? (
        <Composer
          label="New announcement"
          disabled={!title.trim() || !body.trim()}
          onSubmit={() => {
            void addAnnouncement({ title, body });
            setTitle("");
            setBody("");
            toast.success("Announcement posted");
          }}
        >
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-2xl border-white/70 bg-white/80"
          />
          <Textarea
            rows={3}
            placeholder="Details"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-2xl border-white/70 bg-white/80"
          />
        </Composer>
      ) : null}

      {announcements.length ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {announcements.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <GlassCard className={cn("p-5", a.pinned && "ring-1 ring-foreground/10")}>
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
                      <Megaphone className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.title}</p>
                      <p className="mt-1 whitespace-pre-line break-words text-sm text-muted-foreground">
                        {a.body}
                      </p>
                      <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                        {a.authorName} · {new Date(a.ts).toLocaleDateString()}
                        {a.pinned ? " · Pinned" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {(
                      [
                        { kind: "helpful" as const, icon: ThumbsUp, label: "Helpful" },
                        { kind: "thanks" as const, icon: Heart, label: "Thanks" },
                      ]
                    ).map((r) => (
                      <button
                        key={r.kind}
                        type="button"
                        onClick={() => void react(a.id, r.kind)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          a.myReaction === r.kind
                            ? "bg-ink text-ink-foreground"
                            : "bg-white/60 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <r.icon className="size-3.5" /> {r.label}
                        <span className="tnum">{a.reactions[r.kind] ?? 0}</span>
                      </button>
                    ))}
                    {can(role, "announcement.pin") ? (
                      <button
                        type="button"
                        onClick={() => void togglePin(a.id)}
                        className="ml-auto grid size-8 place-items-center rounded-full bg-white/60 text-muted-foreground hover:text-foreground"
                        aria-label="Pin announcement"
                      >
                        <Pin className="size-3.5" />
                      </button>
                    ) : null}
                    {can(role, "announcement.delete") ? (
                      <button
                        type="button"
                        onClick={() => void deleteAnnouncement(a.id)}
                        className="grid size-8 place-items-center rounded-full bg-white/60 text-muted-foreground hover:text-bad"
                        aria-label="Delete announcement"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Empty text="No announcements yet." />
      )}
    </section>
  );
}

function Polls({ role }: { role: Role }) {
  const { polls, addPoll, vote, deletePoll } = useClassSpace();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("Yes\nNo");

  return (
    <section className="space-y-3">
      <SectionTitle title="🗳 Polls" subtitle="One vote per student" />
      {can(role, "poll.create") ? (
        <Composer
          label="New poll"
          disabled={!question.trim() || options.split("\n").filter((o) => o.trim()).length < 2}
          onSubmit={() => {
            void addPoll({ question, options: options.split("\n") });
            setQuestion("");
            setOptions("Yes\nNo");
            toast.success("Poll created");
          }}
        >
          <Input
            placeholder="Should we request DSP Lab tomorrow?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="rounded-2xl border-white/70 bg-white/80"
          />
          <Textarea
            rows={3}
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="One option per line"
            className="rounded-2xl border-white/70 bg-white/80"
          />
        </Composer>
      ) : null}

      {polls.length ? (
        <div className="space-y-3">
          {polls.map((p) => {
            const total = p.options.reduce((sum, o) => sum + o.votes, 0);
            return (
              <GlassCard key={p.id} className="p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
                    <Vote className="size-4 text-muted-foreground" />
                  </span>
                  <p className="min-w-0 flex-1 break-words text-sm font-semibold">{p.question}</p>
                  {can(role, "poll.delete") ? (
                    <button
                      type="button"
                      onClick={() => void deletePoll(p.id)}
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-white/60 text-muted-foreground hover:text-bad"
                      aria-label="Delete poll"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 space-y-2">
                  {p.options.map((o) => {
                    const share = total ? Math.round((o.votes / total) * 100) : 0;
                    const mine = p.myVote === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        disabled={Boolean(p.myVote)}
                        onClick={() => void vote(p.id, o.id)}
                        className="relative w-full overflow-hidden rounded-2xl bg-white/60 px-4 py-2.5 text-left"
                      >
                        <span
                          className="absolute inset-y-0 left-0 bg-foreground/10 transition-[width] duration-500"
                          style={{ width: p.myVote ? `${share}%` : "0%" }}
                        />
                        <span className="relative flex min-w-0 items-center justify-between gap-3 text-sm">
                          <span className={cn("truncate", mine && "font-semibold")}>{o.label}</span>
                          {p.myVote ? (
                            <span className="tnum shrink-0 text-xs text-muted-foreground">
                              {share}%
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {total} vote{total === 1 ? "" : "s"}
                </p>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <Empty text="No polls right now." />
      )}
    </section>
  );
}

function Upcoming({ role }: { role: Role }) {
  const { events, addEvent, deleteEvent } = useClassSpace();
  const [kind, setKind] = useState<ClassEventKind>("Assignment");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  return (
    <section className="space-y-3">
      <SectionTitle title="📅 Upcoming" subtitle="Assignments, seminars, labs and IAs" />
      {can(role, "event.manage") ? (
        <Composer
          label="Add date"
          disabled={!title.trim() || !date}
          onSubmit={() => {
            void addEvent({ kind, title, date });
            setTitle("");
            setDate("");
            toast.success("Added to upcoming");
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {EVENT_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium",
                  kind === k ? "bg-ink text-ink-foreground" : "bg-white/60 text-muted-foreground",
                )}
              >
                {k}
              </button>
            ))}
          </div>
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-2xl border-white/70 bg-white/80"
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-2xl border-white/70 bg-white/80"
          />
        </Composer>
      ) : null}

      {events.length ? (
        <GlassCard className="divide-y divide-foreground/5 p-2">
          {events.map((e) => (
            <div key={e.id} className="flex min-w-0 items-center gap-3 px-3 py-3">
              <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{e.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.kind} · {new Date(`${e.date}T00:00:00`).toLocaleDateString()}
                </p>
              </div>
              {can(role, "event.manage") ? (
                <button
                  type="button"
                  onClick={() => void deleteEvent(e.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-white/60 text-muted-foreground hover:text-bad"
                  aria-label="Delete event"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>
          ))}
        </GlassCard>
      ) : (
        <Empty text="Nothing scheduled yet." />
      )}
    </section>
  );
}

function ImportantLinks() {
  return (
    <section className="space-y-3">
      <SectionTitle title="📌 Important links" subtitle="Opens in your browser" />
      <GlassCard className="divide-y divide-foreground/5 p-2">
        {IMPORTANT_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/60"
          >
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{l.label}</span>
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </GlassCard>
    </section>
  );
}

function Resources({ role }: { role: Role }) {
  const { resources, addResource, deleteResource } = useClassSpace();
  const [kind, setKind] = useState<ResourceKind>("PDF");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  return (
    <section className="space-y-3 pb-2">
      <SectionTitle title="📂 Shared resources" subtitle="PDF, PPT and links only" />
      {can(role, "resource.manage") ? (
        <Composer
          label="Add resource"
          disabled={!title.trim() || !/^https?:\/\//.test(url.trim())}
          onSubmit={() => {
            void addResource({ kind, title, url: url.trim() });
            setTitle("");
            setUrl("");
            toast.success("Resource added");
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {RESOURCE_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium",
                  kind === k ? "bg-ink text-ink-foreground" : "bg-white/60 text-muted-foreground",
                )}
              >
                {k}
              </button>
            ))}
          </div>
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-2xl border-white/70 bg-white/80"
          />
          <Input
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-2xl border-white/70 bg-white/80"
          />
        </Composer>
      ) : null}

      {resources.length ? (
        <GlassCard className="divide-y divide-foreground/5 p-2">
          {resources.map((r) => (
            <div key={r.id} className="flex min-w-0 items-center gap-3 px-3 py-3">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-semibold"
              >
                {r.title}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{r.kind}</span>
              </a>
              {can(role, "resource.manage") ? (
                <button
                  type="button"
                  onClick={() => void deleteResource(r.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-white/60 text-muted-foreground hover:text-bad"
                  aria-label="Delete resource"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>
          ))}
        </GlassCard>
      ) : (
        <Empty text="No shared resources yet." />
      )}
    </section>
  );
}
