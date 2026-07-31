import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, MinusCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { DAYS } from "@/lib/types";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "Today — AttendX" },
      {
        name: "description",
        content: "Mark present, absent or skip for each of today's CMR University classes.",
      },
      { property: "og:title", content: "Today — AttendX" },
      { property: "og:description", content: "One-tap attendance marking for today's classes." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { timetable, mark, subjects } = useApp();
  const [done, setDone] = useState<Record<string, "present" | "absent" | "skip">>({});
  const now = new Date();
  const day = now.getDay();

  const todays = timetable
    .filter((s) => s.day === day)
    .sort((a, b) => a.start.localeCompare(b.start));

  const act = async (slotId: string, code: string, action: "present" | "absent" | "skip") => {
    setDone((d) => ({ ...d, [slotId]: action }));
    if (action === "skip") {
      toast("Class skipped — counts unchanged");
      return;
    }
    if (!subjects.some((s) => s.code === code)) {
      toast.error("Subject not found. Import your subjects first.");
      return;
    }
    await mark(code, action, slotId);
    toast.success(action === "present" ? "Marked present" : "Marked absent");
  };

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, { day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{DAYS[day]}</h1>
      </header>

      {todays.length ? (
        <div className="space-y-4">
          {todays.map((slot, i) => {
            const state = done[slot.id];
            return (
              <GlassCard key={slot.id} delay={i * 0.05} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="tnum text-sm font-medium text-muted-foreground">
                      {slot.start}–{slot.end}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                      {slot.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {slot.code} · {slot.faculty || "Faculty"} · {slot.room || "Room"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {slot.session}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    className="rounded-2xl"
                    variant={state === "present" ? "default" : "secondary"}
                    onClick={() => act(slot.id, slot.code, "present")}
                  >
                    <Check className="size-4" /> Present
                  </Button>
                  <Button
                    className="rounded-2xl"
                    variant={state === "absent" ? "destructive" : "secondary"}
                    onClick={() => act(slot.id, slot.code, "absent")}
                  >
                    <X className="size-4" /> Absent
                  </Button>
                  <Button
                    className="rounded-2xl"
                    variant="ghost"
                    onClick={() => act(slot.id, slot.code, "skip")}
                  >
                    <MinusCircle className="size-4" /> Skip
                  </Button>
                  {state ? (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="self-center text-xs capitalize text-muted-foreground"
                    >
                      Marked {state}
                    </motion.span>
                  ) : null}
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard className="p-10 text-center">
          <p className="font-display text-xl font-semibold">No classes today</p>
          <p className="mt-2 text-sm text-muted-foreground">Rest, or get ahead on revision.</p>
        </GlassCard>
      )}
    </div>
  );
}
