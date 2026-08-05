import { Check, X } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { todaysMarks, todaysSlots } from "@/lib/today";

/** One-tap present / absent marking for today's scheduled classes. */
export function DailyAttendance() {
  const { timetable, history, mark } = useApp();
  const todays = useMemo(() => todaysSlots(timetable), [timetable]);
  const marks = useMemo(() => todaysMarks(history), [history]);

  const act = async (
    slot: { id: string; code: string; name: string; faculty: string },
    action: "present" | "absent",
  ) => {
    if (marks[slot.id]) return;
    await mark(slot.code, action, slot.id, { name: slot.name, faculty: slot.faculty });
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
        const state = marks[slot.id];
        return (
          <GlassCard key={slot.id} delay={i * 0.04} className="p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="tnum shrink-0 text-xs font-medium text-muted-foreground">
                {slot.start}
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
                  onClick={() => act(slot, "present")}
                >
                  <Check className="size-4" /> Went
                </Button>
                <Button
                  className="h-10 w-full rounded-2xl"
                  variant="secondary"
                  onClick={() => act(slot, "absent")}
                >
                  <X className="size-4" /> Bunked
                </Button>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}

