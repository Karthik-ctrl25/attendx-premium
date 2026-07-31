import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Minus, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AttendanceUploader, type ExtractResult } from "@/components/attendx/AttendanceUploader";
import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import {
  diffSubjects,
  mergeSubjects,
  pct,
  replaceSubjects,
  type SubjectDiff,
} from "@/lib/attendance-import";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<SubjectDiff["kind"], string> = {
  changed: "Differs from ERP",
  new: "New in ERP",
  missing: "Not in this screenshot",
  same: "Matches",
};

const KIND_TONE: Record<SubjectDiff["kind"], string> = {
  changed: "text-warn",
  new: "text-good",
  missing: "text-muted-foreground",
  same: "text-muted-foreground",
};

function Counts({ label, s }: { label: string; s?: { present: number; absent: number; total: number } }) {
  return (
    <div className="rounded-2xl bg-white/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="tnum mt-0.5 text-sm font-semibold">
        {s ? `${s.present} / ${s.total}` : "—"}
        {s ? (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">{pct(s as never)}%</span>
        ) : null}
      </p>
    </div>
  );
}

/** Weekly ERP cross-check — stored vs ERP, never overwritten automatically. */
export function VerifyAttendance({ onDone }: { onDone?: () => void }) {
  const { subjects, saveSubjects, recordImport, updateMeta } = useApp();
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [saving, setSaving] = useState(false);

  const diffs = result ? diffSubjects(subjects, result.subjects) : [];
  const changed = diffs.filter((d) => d.kind !== "same");

  const finish = async (next: typeof subjects | null) => {
    if (!result) return;
    setSaving(true);
    try {
      if (next) await saveSubjects(next);
      await recordImport({
        fileHash: result.fileHash,
        dataHash: result.dataHash,
        subjectCount: result.subjects.length,
        confidence: result.confidence,
      });
      await updateMeta({ lastVerifiedAt: Date.now() });
      toast.success(next ? "Attendance synced with ERP" : "Verification recorded — nothing changed");
      setResult(null);
      onDone?.();
    } finally {
      setSaving(false);
    }
  };

  if (!result) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/75 shadow-soft">
            <ShieldCheck className="size-5 text-muted-foreground" />
          </span>
          <div>
            <h2 className="font-display text-[26px] font-semibold tracking-tight">
              Verify Attendance
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Once a week, upload a fresh ERP screenshot. We'll show the differences — nothing is
              overwritten without your choice.
            </p>
          </div>
        </div>
        <AttendanceUploader
          existing={subjects}
          duplicateCheck={false}
          title="Drop your latest ERP screenshot"
          onResult={setResult}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-[26px] font-semibold tracking-tight">
          {changed.length ? `${changed.length} difference${changed.length > 1 ? "s" : ""} found` : "Everything matches"}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Stored counts on the left, ERP on the right. Choose what to do.
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {diffs.map((d, i) => (
            <motion.div
              key={d.code}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.35 }}
            >
              <GlassCard
                className={cn("p-4", d.kind === "changed" && "ring-1 ring-warn/50")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-semibold tracking-tight">
                      {d.name}
                    </p>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {d.code}
                    </p>
                  </div>
                  <span className={cn("shrink-0 text-xs font-medium", KIND_TONE[d.kind])}>
                    {KIND_LABEL[d.kind]}
                  </span>
                </div>
                {d.kind === "same" ? null : (
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <Counts label="Stored" s={d.stored} />
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <Counts label="ERP" s={d.erp} />
                  </div>
                )}
                {d.delta !== 0 && d.kind === "changed" ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {d.delta > 0 ? <Plus className="size-3" /> : <Minus className="size-3" />}
                    {Math.abs(d.delta)} class{Math.abs(d.delta) > 1 ? "es" : ""} difference in total
                  </p>
                ) : null}
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-11 flex-1 rounded-2xl"
          disabled={saving}
          onClick={() => finish(replaceSubjects(subjects, result.subjects))}
        >
          <Check className="size-4" /> Replace with ERP
        </Button>
        <Button
          variant="secondary"
          className="h-11 flex-1 rounded-2xl"
          disabled={saving}
          onClick={() => finish(mergeSubjects(subjects, result.subjects))}
        >
          Merge
        </Button>
        <Button
          variant="ghost"
          className="h-11 flex-1 rounded-2xl"
          disabled={saving}
          onClick={() => finish(null)}
        >
          Ignore
        </Button>
      </div>
    </div>
  );
}
