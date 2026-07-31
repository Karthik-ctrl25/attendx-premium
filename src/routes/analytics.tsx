import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AttendanceRing } from "@/components/attendx/AttendanceRing";
import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { bestAndWorst, overallStats, percent, statusOf, STATUS_COLOR, trendSeries } from "@/lib/attendance";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — AttendX" },
      {
        name: "description",
        content: "Subject comparison, best and weakest subjects, and your attendance trend.",
      },
      { property: "og:title", content: "Analytics — AttendX" },
      {
        property: "og:description",
        content: "Charts and progress rings for your CMR University attendance.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { subjects, history } = useApp();
  const stats = overallStats(subjects);
  const { best, worst } = bestAndWorst(subjects);
  const trend = trendSeries(history);

  const comparison = subjects.map((s) => ({
    code: s.code,
    pct: Math.round(percent(s.present, s.total)),
    fill: STATUS_COLOR[statusOf(percent(s.present, s.total), s.total)],
  }));

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">How your semester is really going</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard strong className="flex flex-col items-center p-7">
          <AttendanceRing value={stats.pct} total={stats.total} sublabel="Overall" />
        </GlassCard>

        <GlassCard delay={0.05} className="p-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Best subject
          </p>
          {best ? (
            <>
              <p className="mt-3 font-display text-2xl font-semibold">{best.name}</p>
              <p className="tnum text-good">{percent(best.present, best.total).toFixed(1)}%</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Not enough data yet.</p>
          )}
        </GlassCard>

        <GlassCard delay={0.1} className="p-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Weakest subject
          </p>
          {worst ? (
            <>
              <p className="mt-3 font-display text-2xl font-semibold">{worst.name}</p>
              <p className="tnum text-bad">{percent(worst.present, worst.total).toFixed(1)}%</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Not enough data yet.</p>
          )}
        </GlassCard>
      </div>

      <section>
        <SectionTitle title="Subject comparison" />
        <GlassCard className="p-5">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 60%)" vertical={false} />
                <XAxis dataKey="code" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 35%)" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid oklch(1 0 0 / 70%)",
                    background: "oklch(1 0 0 / 85%)",
                    backdropFilter: "blur(12px)",
                  }}
                />
                <Bar dataKey="pct" radius={[10, 10, 10, 10]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionTitle title="Attendance trend" subtitle="Rolling overall percentage" />
        <GlassCard className="p-5">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 60%)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid oklch(1 0 0 / 70%)",
                    background: "oklch(1 0 0 / 85%)",
                    backdropFilter: "blur(12px)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="var(--chart-4)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionTitle title="Progress rings" />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {subjects.map((s, i) => (
            <GlassCard key={s.code} delay={i * 0.04} className="flex flex-col items-center p-5">
              <AttendanceRing
                value={percent(s.present, s.total)}
                total={s.total}
                size={112}
                stroke={10}
              />
              <p className="mt-3 truncate text-sm font-semibold">{s.code}</p>
              <p className="truncate text-xs text-muted-foreground">{s.name}</p>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}
