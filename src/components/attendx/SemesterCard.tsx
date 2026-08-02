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
      <GlassCard className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
          <GraduationCap className="size-3.5 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">
            Semester {meta.semester || "—"} · Section {meta.section || "—"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            AttendX will ask you when the next semester begins.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard strong className="flex min-w-0 flex-wrap items-center gap-2.5 px-3 py-2.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
        <CalendarPlus className="size-3.5 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">A new semester has started.</p>
        <p className="truncate text-[11px] text-muted-foreground">
          Are you now in Semester {next}?
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Button size="sm" className="h-8 rounded-xl px-3" onClick={accept}>
          Yes
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 rounded-xl px-3"
          onClick={() => updateMeta({ semesterPromptSnoozedFor: next })}
        >
          Later
        </Button>
      </div>
    </GlassCard>
  );
}
