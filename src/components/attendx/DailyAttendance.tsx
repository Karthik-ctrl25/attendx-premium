import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";

/** One-tap present / absent marking for today's scheduled classes. */
export function DailyAttendance() {
  const { timetable, subjects, mark } = useApp();
  const [done, setDone] = useState<Record<string, "present" | "absent">>({});
  const day = new Date().getDay();

  const todays = timetable
    .filter((s) => s.day === day)
    .sort((a, b) => a.start.localeCompare(b.start));

  const act = async (slotId: string, code: string, action: "present" | "absent") => {
    if (!subjects.some((s) => s.code === code)) {
      toast.error("Subject not found. Import your attendance first.");
      return;
    }
    setDone((d) => ({ ...d, [slotId]: action }));
    await mark(code, action, slotId);
    toast.success(action === "present" ? "Marked present" : "Marked absent");
  };

  if (!todays.length) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="font-display text-base font-semibold">No classes today</p>
        <p className="mt-1 text-sm text-muted-foreground">Nothing to mark.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {todays.map((slot, i) => {
        const state = done[slot.id];
        return (
          <GlassCard key={slot.id} delay={i * 0.04} className="p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="tnum shrink-0 text-xs font-medium text-muted-foreground">
                {slot.start}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{slot.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {slot.code} · {slot.room || "Room"}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                className="h-10 w-full rounded-2xl"
                variant={state === "present" ? "default" : "secondary"}
                onClick={() => act(slot.id, slot.code, "present")}
              >
                <Check className="size-4" /> Present
              </Button>
              <Button
                className="h-10 w-full rounded-2xl"
                variant={state === "absent" ? "destructive" : "secondary"}
                onClick={() => act(slot.id, slot.code, "absent")}
              >
                <X className="size-4" /> Absent
              </Button>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
