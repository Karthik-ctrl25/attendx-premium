import { createFileRoute } from "@tanstack/react-router";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { SubjectCard } from "@/components/attendx/SubjectCard";
import { AttendanceRing } from "@/components/attendx/AttendanceRing";
import { overallStats } from "@/lib/attendance";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/attendance/")({
  head: () => ({
    meta: [
      { title: "Attendance — AttendX" },
      {
        name: "description",
        content: "Per-subject attendance with present, absent, total and safe-to-miss maths.",
      },
      { property: "og:title", content: "Attendance — AttendX" },
      {
        property: "og:description",
        content: "Track every subject and know exactly how many classes you can miss.",
      },
    ],
  }),
  component: AttendanceIndex,
});

function AttendanceIndex() {
  const { subjects } = useApp();
  const stats = overallStats(subjects);

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subjects.length} subjects tracked</p>
      </header>

      <GlassCard strong className="flex flex-wrap items-center gap-8 p-7">
        <AttendanceRing value={stats.pct} total={stats.total} size={140} sublabel="Overall" />
        <div className="grid flex-1 grid-cols-3 gap-3 text-center">
          {[
            { label: "Present", value: stats.present },
            { label: "Absent", value: stats.absent },
            { label: "Total", value: stats.total },
          ].map((x) => (
            <div key={x.label} className="rounded-2xl bg-white/60 py-4">
              <p className="tnum font-display text-2xl font-semibold">{x.value}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {x.label}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>

      <section>
        <SectionTitle title="Subjects" subtitle="Tap a card for detail, history and controls" />
        {subjects.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map((s, i) => (
              <SubjectCard key={s.code} subject={s} index={i} />
            ))}
          </div>
        ) : (
          <GlassCard className="p-10 text-center text-sm text-muted-foreground">
            No subjects yet. Import them from your profile menu.
          </GlassCard>
        )}
      </section>
    </div>
  );
}
