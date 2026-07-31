import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { DAYS, DAYS_SHORT } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/timetable")({
  head: () => ({
    meta: [
      { title: "Smart Timetable — AttendX" },
      {
        name: "description",
        content: "Your CMR University weekly timetable, generated from an ERP screenshot.",
      },
      { property: "og:title", content: "Smart Timetable — AttendX" },
      {
        property: "og:description",
        content: "Today and week views with room, faculty and session type.",
      },
    ],
  }),
  component: TimetablePage,
});

function TimetablePage() {
  const { timetable } = useApp();
  const today = new Date().getDay();
  const [view, setView] = useState<"today" | "week">("today");
  const [day, setDay] = useState(today);

  const active = view === "today" ? today : day;
  const slots = timetable
    .filter((s) => s.day === active)
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Timetable</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {timetable.length} classes across the week
          </p>
        </div>
        <div className="glass flex rounded-2xl p-1">
          {(["today", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-xl px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                view === v ? "bg-white/85 shadow-soft" : "text-muted-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      {view === "week" ? (
        <div className="flex flex-wrap gap-2">
          {DAYS_SHORT.map((d, i) => (
            <button
              key={d}
              onClick={() => setDay(i)}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-medium transition-all",
                day === i
                  ? "bg-ink text-ink-foreground shadow-soft"
                  : "glass text-muted-foreground",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      ) : null}

      <h2 className="font-display text-lg font-semibold">{DAYS[active]}</h2>

      {slots.length ? (
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <GlassCard key={slot.id} delay={i * 0.04} hover className="p-5">
              <div className="flex flex-wrap items-center gap-5">
                <div className="tnum w-24 shrink-0">
                  <p className="font-display text-lg font-semibold">{slot.start}</p>
                  <p className="text-xs text-muted-foreground">{slot.end}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {slot.code}
                  </p>
                  <p className="truncate font-display text-lg font-semibold">{slot.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {slot.faculty || "Faculty"} · {slot.room || "Room"}
                  </p>
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {slot.session}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 text-center">
          <p className="font-display text-lg font-semibold">Nothing scheduled</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit your timetable anytime from Settings.
          </p>
          <Button asChild variant="secondary" className="mt-5 rounded-2xl">
            <a href="/settings">Open Settings</a>
          </Button>
        </GlassCard>
      )}
    </div>
  );
}
