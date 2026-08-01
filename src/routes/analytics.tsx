import { createFileRoute } from "@tanstack/react-router";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { bestAndWorst, classesCanMiss, percent } from "@/lib/attendance";
import { useApp } from "@/lib/store";
import type { HistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — AttendX" },
      {
        name: "description",
        content: "Best and weakest subject, monthly trend, attendance calendar and safe bunks.",
      },
      { property: "og:title", content: "Analytics — AttendX" },
      {
        property: "og:description",
        content: "A focused view of how your semester is really going.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

/** Overall percentage at the end of each of the last 6 months. */
function monthlyTrend(history: HistoryEntry[]) {
  const live = history.filter((h) => !h.undone).sort((a, b) => a.ts - b.ts);
  const out: { label: string; pct: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59).getTime();
    const upTo = live.filter((h) => h.ts <= end);
    const present = upTo.filter((h) => h.action === "present").length;
    out.push({
      label: new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleDateString(undefined, {
        month: "short",
      }),
      pct: upTo.length ? Math.round((present / upTo.length) * 100) : 0,
    });
  }
  return out;
}

function AnalyticsPage() {
  const { subjects, history } = useApp();
  const { best, worst } = bestAndWorst(subjects);
  const trend = monthlyTrend(history);

  return (
    <div className="w-full min-w-0 space-y-5 pb-2">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">The numbers that actually matter</p>
      </header>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <GlassCard className="min-w-0 p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Best subject
          </p>
          {best ? (
            <>
              <p className="mt-2 truncate font-display text-lg font-semibold">{best.name}</p>
              <p className="tnum text-good">{percent(best.present, best.total).toFixed(1)}%</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Not enough data yet.</p>
          )}
        </GlassCard>

        <GlassCard delay={0.05} className="min-w-0 p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Weakest subject
          </p>
          {worst ? (
            <>
              <p className="mt-2 truncate font-display text-lg font-semibold">{worst.name}</p>
              <p className="tnum text-bad">{percent(worst.present, worst.total).toFixed(1)}%</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Not enough data yet.</p>
          )}
        </GlassCard>
      </div>

      <section>
        <SectionTitle title="Monthly trend" subtitle="Overall percentage, last 6 months" />
        <GlassCard className="p-5">
          <div className="flex min-w-0 items-end gap-2">
            {trend.map((m) => (
              <div key={m.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end rounded-xl bg-foreground/5">
                  <div
                    className="w-full rounded-xl bg-[image:var(--gradient-ink)]"
                    style={{ height: `${Math.max(4, m.pct)}%` }}
                  />
                </div>
                <span className="tnum text-[10px] text-muted-foreground">{m.pct}%</span>
                <span className="truncate text-[10px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionTitle title="Attendance calendar" subtitle="This month" />
        <CalendarCard history={history} />
      </section>

      <section>
        <SectionTitle title="Safe bunks" subtitle="Classes you can miss and stay above 75%" />
        <GlassCard className="divide-y divide-foreground/5 p-2">
          {subjects.filter((s) => s.total > 0).length ? (
            subjects
              .filter((s) => s.total > 0)
              .map((s) => (
                <div key={s.code} className="flex min-w-0 items-center gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.code}</p>
                  </div>
                  <span className="tnum shrink-0 font-display text-lg font-semibold">
                    {classesCanMiss(s.present, s.total, 75)}
                  </span>
                </div>
              ))
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Import your attendance to see safe bunks.
            </p>
          )}
        </GlassCard>
      </section>
    </div>
  );
}

function CalendarCard({ history }: { history: HistoryEntry[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();

  const byDay = new Map<number, { present: number; absent: number }>();
  history
    .filter((h) => !h.undone)
    .forEach((h) => {
      const d = new Date(h.ts);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const cur = byDay.get(d.getDate()) ?? { present: 0, absent: 0 };
      cur[h.action] += 1;
      byDay.set(d.getDate(), cur);
    });

  return (
    <GlassCard className="p-4">
      <div className="grid grid-cols-7 gap-1.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-center text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {Array.from({ length: first.getDay() }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const date = i + 1;
          const rec = byDay.get(date);
          const tone = !rec
            ? "bg-foreground/5 text-muted-foreground"
            : rec.absent > rec.present
              ? "bg-bad/20 text-bad"
              : "bg-good/20 text-good";
          return (
            <span
              key={date}
              className={cn(
                "tnum grid aspect-square place-items-center rounded-lg text-[11px] font-medium",
                tone,
                date === now.getDate() && "ring-1 ring-foreground/25",
              )}
            >
              {date}
            </span>
          );
        })}
      </div>
    </GlassCard>
  );
}
