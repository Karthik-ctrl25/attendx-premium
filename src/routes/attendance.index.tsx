import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AttendanceRing } from "@/components/attendx/AttendanceRing";
import { BunkCalculator } from "@/components/attendx/BunkCalculator";
import { DailyAttendance } from "@/components/attendx/DailyAttendance";
import { GlassCard } from "@/components/attendx/GlassCard";
import { SubjectCard } from "@/components/attendx/SubjectCard";
import { Button } from "@/components/ui/button";
import { classesCanMiss, overallStats } from "@/lib/attendance";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/attendance/")({
  head: () => ({
    meta: [
      { title: "Attendance — AttendX" },
      {
        name: "description",
        content:
          "Mark today's classes, review subject attendance, calculate safe bunks and verify against ERP.",
      },
      { property: "og:title", content: "Attendance — AttendX" },
      {
        property: "og:description",
        content: "Everything about your attendance in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttendanceIndex,
});

const TABS = [
  { key: "subjects", label: "Subjects" },
  { key: "today", label: "Today" },
  { key: "bunks", label: "Bunks" },
  { key: "history", label: "History" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function AttendanceIndex() {
  const { subjects, meta } = useApp();
  const [tab, setTab] = useState<Tab>("subjects");
  const stats = overallStats(subjects);
  const safe = classesCanMiss(stats.present, stats.total, 75);

  const verified = meta.lastVerifiedAt
    ? new Date(meta.lastVerifiedAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })
    : "Never";

  return (
    <div className="w-full min-w-0 space-y-5">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Attendance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subjects.length} subjects tracked</p>
      </header>

      <GlassCard strong className="flex min-w-0 items-center gap-5 p-5">
        <AttendanceRing
          value={stats.pct}
          total={stats.total}
          size={112}
          stroke={11}
          sublabel="Overall"
          className="shrink-0"
        />
        <div className="grid min-w-0 flex-1 gap-2">
          {[
            { label: "Present", value: stats.present },
            { label: "Absent", value: stats.absent },
            { label: "Safe bunks", value: safe },
          ].map((x) => (
            <div
              key={x.label}
              className="flex min-w-0 items-center justify-between rounded-2xl bg-white/60 px-3 py-2"
            >
              <span className="truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {x.label}
              </span>
              <span className="tnum shrink-0 font-display text-base font-semibold">{x.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="flex min-w-0 items-center gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <ShieldCheck className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Verify ERP</p>
          <p className="truncate text-sm font-semibold">Last verified {verified}</p>
        </div>
        <Button asChild size="sm" variant="secondary" className="shrink-0 rounded-xl">
          <Link to="/verify">Verify</Link>
        </Button>
      </GlassCard>

      <div className="glass grid grid-cols-4 gap-1 rounded-2xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "min-w-0 truncate rounded-xl py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-ink text-ink-foreground shadow-soft" : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pb-2">
        {tab === "subjects" ? <SubjectsTab /> : null}
        {tab === "today" ? <DailyAttendance /> : null}
        {tab === "bunks" ? <BunkCalculator /> : null}
        {tab === "history" ? <HistoryTab /> : null}
      </div>
    </div>
  );
}

function SubjectsTab() {
  const { subjects } = useApp();
  if (!subjects.length) {
    return (
      <GlassCard className="p-8 text-center text-sm text-muted-foreground">
        No subjects yet. Upload an attendance screenshot to get started.
      </GlassCard>
    );
  }
  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      {subjects.map((s, i) => (
        <SubjectCard key={s.code} subject={s} index={i} />
      ))}
    </div>
  );
}

function HistoryTab() {
  const { history, undo } = useApp();
  if (!history.length) {
    return (
      <GlassCard className="p-8 text-center text-sm text-muted-foreground">
        Mark a class to start your log.
      </GlassCard>
    );
  }
  return (
    <GlassCard className="divide-y divide-foreground/5 p-2">
      {history.slice(0, 40).map((h) => (
        <div key={h.id} className="flex min-w-0 items-center gap-3 px-3 py-3">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              h.action === "present" ? "bg-good" : "bg-bad",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{h.name}</p>
            <p className="tnum truncate text-xs text-muted-foreground">
              {new Date(h.ts).toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 rounded-xl text-muted-foreground"
            onClick={async () => {
              await undo(h.id);
              toast("Action undone");
            }}
          >
            <Undo2 className="size-4" />
          </Button>
        </div>
      ))}
    </GlassCard>
  );
}
