import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, GraduationCap } from "lucide-react";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { useApp } from "@/lib/store";
import { DAYS_SHORT } from "@/lib/types";

export const Route = createFileRoute("/class")({
  head: () => ({
    meta: [
      { title: "Class — AttendX" },
      {
        name: "description",
        content: "Your CMR University class: department, semester, section, subjects and faculty.",
      },
      { property: "og:title", content: "Class — AttendX" },
      {
        property: "og:description",
        content: "Department, semester, section and the people teaching you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClassPage,
});

function ClassPage() {
  const { meta, subjects, timetable } = useApp();

  const perDay = DAYS_SHORT.map((label, day) => ({
    label,
    count: timetable.filter((s) => s.day === day).length,
  }));
  const max = Math.max(1, ...perDay.map((d) => d.count));

  return (
    <div className="w-full min-w-0 space-y-5 pb-2">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Class</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.university}</p>
      </header>

      <GlassCard strong className="min-w-0 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-ink)] text-ink-foreground shadow-soft">
            <GraduationCap className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold tracking-tight">
              {meta.department || "Department"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {[meta.semester && `Semester ${meta.semester}`, meta.section && `Section ${meta.section}`]
                .filter(Boolean)
                .join(" · ") || "Set during setup"}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-2xl bg-white/60 px-3 py-2.5 text-center">
            <p className="tnum font-display text-lg font-semibold">{subjects.length}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Subjects
            </p>
          </div>
          <div className="min-w-0 rounded-2xl bg-white/60 px-3 py-2.5 text-center">
            <p className="tnum font-display text-lg font-semibold">{timetable.length}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Weekly classes
            </p>
          </div>
        </div>
      </GlassCard>

      <section>
        <SectionTitle title="Weekly load" subtitle="Classes per day" />
        <GlassCard className="p-5">
          <div className="flex min-w-0 items-end gap-2">
            {perDay.map((d) => (
              <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-20 w-full items-end rounded-xl bg-foreground/5">
                  <div
                    className="w-full rounded-xl bg-[image:var(--gradient-ink)]"
                    style={{ height: `${(d.count / max) * 100 || 4}%` }}
                  />
                </div>
                <span className="truncate text-[10px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionTitle title="Subjects & faculty" />
        {subjects.length ? (
          <GlassCard className="divide-y divide-foreground/5 p-2">
            {subjects.map((s) => (
              <div key={s.code} className="min-w-0 px-3 py-3">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.code} · {s.faculty || "Faculty not set"}
                </p>
              </div>
            ))}
          </GlassCard>
        ) : (
          <GlassCard className="p-8 text-center text-sm text-muted-foreground">
            No subjects yet.
          </GlassCard>
        )}
      </section>

      <Link
        to="/analytics"
        className="glass glass-hover flex min-w-0 items-center gap-3 rounded-3xl p-4"
      >
        <BarChart3 className="size-5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">View analytics</span>
      </Link>
    </div>
  );
}
