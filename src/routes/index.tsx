import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, Clock, Sparkles } from "lucide-react";

import { AttendanceRing } from "@/components/attendx/AttendanceRing";
import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { SubjectCard } from "@/components/attendx/SubjectCard";
import { Button } from "@/components/ui/button";
import { overallStats, percent, statusOf } from "@/lib/attendance";
import { useApp } from "@/lib/store";
import { DAYS } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AttendX" },
      {
        name: "description",
        content:
          "Your attendance at a glance: overall percentage, today's classes and low-attendance warnings.",
      },
      { property: "og:title", content: "Dashboard — AttendX" },
      {
        property: "og:description",
        content: "Overall attendance, today's classes and warnings in one calm glass dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

function greeting(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function Dashboard() {
  const { subjects, timetable, history, meta } = useApp();
  const now = new Date();
  const day = now.getDay();
  const stats = overallStats(subjects);

  const todays = timetable
    .filter((s) => s.day === day)
    .sort((a, b) => a.start.localeCompare(b.start));
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const upcoming = todays.filter((s) => s.start > clock);
  const atRisk = subjects.filter((s) => s.total > 0 && percent(s.present, s.total) < 75);

  return (
    <div className="space-y-8">
      <header className="pt-2">
        <p className="text-sm text-muted-foreground">
          {DAYS[day]} · {now.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {greeting(now.getHours())}
          {meta.studentName ? `, ${meta.studentName}` : ""}
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
        <GlassCard strong className="flex flex-col items-center gap-4 p-7">
          <AttendanceRing value={stats.pct} total={stats.total} sublabel="Overall" />
          <div className="grid w-full grid-cols-3 gap-2 text-center">
            {[
              { label: "Present", value: stats.present },
              { label: "Absent", value: stats.absent },
              { label: "Total", value: stats.total },
            ].map((x) => (
              <div key={x.label} className="rounded-2xl bg-white/60 py-3">
                <p className="tnum font-display text-lg font-semibold">{x.value}</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {x.label}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard delay={0.05} className="p-6">
            <SectionTitle
              title="Today's Classes"
              subtitle={todays.length ? `${todays.length} scheduled` : "Nothing scheduled today"}
              action={
                <Button asChild variant="secondary" size="sm" className="rounded-xl">
                  <Link to="/today">
                    Open <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              }
            />
            {todays.length ? (
              <ul className="space-y-2">
                {todays.slice(0, 4).map((slot) => (
                  <li
                    key={slot.id}
                    className="flex items-center gap-4 rounded-2xl bg-white/55 px-4 py-3"
                  >
                    <span className="tnum w-24 shrink-0 text-sm font-medium">
                      {slot.start}–{slot.end}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{slot.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {slot.faculty || "Faculty"} · {slot.room || "Room"} · {slot.session}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl bg-white/55 px-4 py-6 text-center text-sm text-muted-foreground">
                Enjoy the free day.
              </p>
            )}
          </GlassCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <GlassCard delay={0.1} className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                <p className="text-[11px] uppercase tracking-[0.16em]">Upcoming</p>
              </div>
              {upcoming.length ? (
                <>
                  <p className="mt-3 font-display text-xl font-semibold">{upcoming[0].name}</p>
                  <p className="tnum text-sm text-muted-foreground">
                    {upcoming[0].start} · {upcoming[0].room || "Room TBA"}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No more classes today.</p>
              )}
            </GlassCard>

            <GlassCard delay={0.14} className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="size-4" />
                <p className="text-[11px] uppercase tracking-[0.16em]">Warning</p>
              </div>
              {atRisk.length ? (
                <>
                  <p className="mt-3 font-display text-xl font-semibold text-bad">
                    {atRisk.length} subject{atRisk.length > 1 ? "s" : ""} below 75%
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {atRisk.map((s) => s.code).join(", ")}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Everything is above the safe line.
                </p>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      <section>
        <SectionTitle
          title="Subjects"
          subtitle="Green above 85% · Orange 75–85% · Red below 75%"
          action={
            <Button asChild variant="secondary" size="sm" className="rounded-xl">
              <Link to="/attendance">All subjects</Link>
            </Button>
          }
        />
        {subjects.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.slice(0, 4).map((s, i) => (
              <SubjectCard key={s.code} subject={s} index={i} />
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center text-sm text-muted-foreground">
            No subjects yet — add them from Settings.
          </GlassCard>
        )}
      </section>

      <section>
        <SectionTitle title="Recent Activity" />
        <GlassCard className="divide-y divide-white/60 p-2">
          {history.slice(0, 5).map((h) => {
            const st = h.action === "present" ? "text-good" : "text-bad";
            return (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                <Sparkles className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.ts).toLocaleString(undefined, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className={`text-sm font-semibold capitalize ${st}`}>{h.action}</span>
              </div>
            );
          })}
          {!history.length ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Mark your first class to start the log.
            </p>
          ) : null}
        </GlassCard>
      </section>

      <p className="pb-4 text-center text-xs text-muted-foreground/70">
        {statusOf(stats.pct, stats.total) === "good"
          ? "You're comfortably ahead. Keep it steady."
          : "Small consistent wins move the ring."}
      </p>
    </div>
  );
}
