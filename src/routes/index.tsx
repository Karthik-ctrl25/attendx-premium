import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarRange, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

import { AttendanceRing } from "@/components/attendx/AttendanceRing";
import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { SemesterCard } from "@/components/attendx/SemesterCard";
import { Button } from "@/components/ui/button";
import { classesCanMiss, overallStats } from "@/lib/attendance";
import { useApp } from "@/lib/store";
import { DAYS } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — AttendX" },
      {
        name: "description",
        content:
          "Your attendance at a glance: overall percentage, today's classes, next class and safe bunks.",
      },
      { property: "og:title", content: "Home — AttendX" },
      {
        property: "og:description",
        content: "Overall attendance, today's classes and safe bunks in one calm view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { subjects, timetable, meta } = useApp();
  const now = new Date();
  const day = now.getDay();
  const stats = overallStats(subjects);
  const safeBunks = classesCanMiss(stats.present, stats.total, 75);

  const todays = timetable
    .filter((s) => s.day === day)
    .sort((a, b) => a.start.localeCompare(b.start));
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const next = todays.find((s) => s.start > clock);

  const verified = meta.lastVerifiedAt
    ? new Date(meta.lastVerifiedAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })
    : "Never";

  return (
    <div className="w-full min-w-0 space-y-5">
      <header>
        <p className="text-sm text-muted-foreground">
          {DAYS[day]} · {now.toLocaleDateString(undefined, { day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting(now.getHours())}
          {meta.studentName ? `, ${meta.studentName.split(" ")[0]}` : ""}
        </h1>
      </header>

      <SemesterCard compact />

      <GlassCard strong className="flex flex-col items-center gap-4 p-6">
        <AttendanceRing value={stats.pct} total={stats.total} size={150} sublabel="Overall" />
        <div className="grid w-full grid-cols-3 gap-2 text-center">
          {[
            { label: "Present", value: stats.present },
            { label: "Absent", value: stats.absent },
            { label: "Safe bunks", value: safeBunks },
          ].map((x) => (
            <div key={x.label} className="min-w-0 rounded-2xl bg-white/60 py-3">
              <p className="tnum font-display text-lg font-semibold">{x.value}</p>
              <p className="truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {x.label}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard delay={0.05} className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          <p className="text-[11px] uppercase tracking-[0.16em]">Next class</p>
        </div>
        {next ? (
          <div className="mt-2 min-w-0">
            <p className="truncate font-display text-lg font-semibold">{next.name}</p>
            <p className="tnum truncate text-sm text-muted-foreground">
              {next.start}–{next.end} · {next.room || "Room TBA"}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No more classes today.</p>
        )}
      </GlassCard>

      <section>
        <SectionTitle
          title="Today's classes"
          subtitle={todays.length ? `${todays.length} scheduled` : "Nothing scheduled"}
        />
        {todays.length ? (
          allMarked ? (
            <GlassCard className="p-8 text-center text-sm text-muted-foreground">
              All classes completed today.
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {todays.map((slot) => {
                const state = marks[slot.id];
                return (
                  <GlassCard key={slot.id} className="p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="tnum w-24 shrink-0 text-xs font-medium text-muted-foreground">
                        {slot.start}–{slot.end}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{slot.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[slot.faculty, slot.room].filter(Boolean).join(" · ") || slot.code}
                        </p>
                      </div>
                    </div>
                    {state ? (
                      <p className="mt-3 text-xs font-medium text-muted-foreground">
                        {state === "present" ? "✓ Marked Present" : "✗ Marked Absent"}
                      </p>
                    ) : (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          className="h-10 w-full rounded-2xl"
                          variant="secondary"
                          onClick={() =>
                            void mark(slot.code, "present", slot.id, {
                              name: slot.name,
                              faculty: slot.faculty,
                            })
                          }
                        >
                          <CheckCircle2 className="size-4" /> Went
                        </Button>
                        <Button
                          className="h-10 w-full rounded-2xl"
                          variant="secondary"
                          onClick={() =>
                            void mark(slot.code, "absent", slot.id, {
                              name: slot.name,
                              faculty: slot.faculty,
                            })
                          }
                        >
                          <XCircle className="size-4" /> Bunked
                        </Button>
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          )
        ) : (
          <GlassCard className="p-8 text-center text-sm text-muted-foreground">
            Enjoy the free day.
          </GlassCard>
        )}
      </section>

      <GlassCard delay={0.1} className="mb-2 flex min-w-0 items-center gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <ShieldCheck className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Last verified
          </p>
          <p className="truncate text-sm font-semibold">{verified}</p>
        </div>
        <Button asChild size="sm" variant="secondary" className="shrink-0 rounded-xl">
          <Link to="/verify">Verify now</Link>
        </Button>
      </GlassCard>

    </div>
  );
}
