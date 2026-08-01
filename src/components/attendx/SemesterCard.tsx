import { useNavigate } from "@tanstack/react-router";
import { CalendarPlus, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { pendingSemester } from "@/lib/semester";
import { useApp } from "@/lib/store";
import { getTimetableFor } from "@/lib/timetable-dataset";

/**
 * Semester rollover. The semester is never editable on a whim — AttendX asks
 * once a term is due, and only an explicit "Yes" moves the student forward,
 * loads the new timetable and asks for one fresh ERP screenshot.
 */
export function SemesterCard({ compact }: { compact?: boolean } = {}) {
  const { meta, updateMeta, saveTimetable } = useApp();
  const navigate = useNavigate();
  const next = pendingSemester(meta);

  const accept = async () => {
    if (!next) return;
    await saveTimetable(getTimetableFor(meta.department ?? "", next, meta.section ?? ""));
    await updateMeta({
      semester: next,
      semesterStartedAt: Date.now(),
      semesterPromptSnoozedFor: "",
      semesterUploadPending: true,
    });
    toast.success(`Moved to Semester ${next} — upload one fresh ERP screenshot`);
    navigate({ to: "/verify" });
  };

  if (!next) {
    if (compact) return null;
    return (
      <GlassCard className="flex min-w-0 items-center gap-3 p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <GraduationCap className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            Semester {meta.semester || "—"} · Section {meta.section || "—"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            AttendX will ask you when the next semester begins.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard strong className="space-y-3 p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <CalendarPlus className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">A new semester has started.</p>
          <p className="text-sm text-muted-foreground">Are you now in Semester {next}?</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button className="rounded-2xl" onClick={accept}>
          Yes
        </Button>
        <Button
          variant="secondary"
          className="rounded-2xl"
          onClick={() => updateMeta({ semesterPromptSnoozedFor: next })}
        >
          Later
        </Button>
      </div>
    </GlassCard>
  );
}
