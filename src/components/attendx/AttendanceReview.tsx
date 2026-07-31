import { motion } from "framer-motion";
import { Trash2, TriangleAlert } from "lucide-react";

import { Input } from "@/components/ui/input";
import { pct } from "@/lib/attendance-import";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

const field =
  "h-9 rounded-xl border-white/70 bg-white/70 text-center text-sm tnum shadow-none focus-visible:ring-1 focus-visible:ring-ring";

/** Editable review cards shown after OCR — nothing is saved automatically. */
export function AttendanceReview({
  subjects,
  onChange,
  lowConfidence,
}: {
  subjects: Subject[];
  onChange: (next: Subject[]) => void;
  lowConfidence?: boolean;
}) {
  const patch = (code: string, p: Partial<Subject>) =>
    onChange(
      subjects.map((s) => {
        if (s.code !== code) return s;
        const next = { ...s, ...p };
        if (p.present !== undefined || p.absent !== undefined) {
          next.total = Math.max(next.total, next.present + next.absent);
        }
        // Any manual edit clears the uncertainty flag for that row.
        next.flagged = false;
        return next;
      }),
    );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-[26px] font-semibold tracking-tight">
          Review what we read
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Edit anything that looks off. Your data is saved only when you continue.
        </p>
      </div>

      {lowConfidence ? (
        <div className="glass flex items-start gap-2.5 rounded-2xl p-3.5 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" />
          <p className="text-muted-foreground">
            We couldn't confidently read this screenshot. Please review before saving.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {subjects.map((s, i) => {
          const percent = pct(s);
          return (
            <motion.div
              key={s.code}
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "glass glass-hover rounded-[26px] p-4",
                s.flagged && "bg-warn/5 ring-1 ring-warn/60",
              )}
            >
              {s.flagged ? (
                <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-warn shadow-soft">
                  <TriangleAlert className="size-3" />
                  {s.flagReason ??
                    `Low confidence${typeof s.confidence === "number" ? ` · ${s.confidence}%` : ""}`}{" "}
                  — please check
                </p>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Input
                    value={s.name}
                    onChange={(e) => patch(s.code, { name: e.target.value })}
                    placeholder="Subject name"
                    className="h-9 rounded-xl border-transparent bg-transparent px-0 font-display text-[15px] font-semibold shadow-none focus-visible:border-white/70 focus-visible:bg-white/70 focus-visible:px-3"
                  />
                  <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {s.code}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "tnum font-display text-2xl font-semibold tracking-tight",
                      percent >= 75 ? "text-good" : percent >= 65 ? "text-warn" : "text-bad",
                    )}
                  >
                    {percent}%
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove ${s.code}`}
                    onClick={() => onChange(subjects.filter((x) => x.code !== s.code))}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-bad"
                  >
                    <Trash2 className="size-3" /> Remove
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["present", "absent", "total"] as const).map((key) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {key}
                    </span>
                    <Input
                      className={field}
                      type="number"
                      min={0}
                      value={s[key]}
                      onChange={(e) =>
                        patch(s.code, { [key]: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  </label>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
