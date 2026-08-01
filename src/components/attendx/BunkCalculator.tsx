import { useState } from "react";

import { GlassCard } from "@/components/attendx/GlassCard";
import { classesCanMiss, classesNeeded, percent, THRESHOLDS } from "@/lib/attendance";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/** How many classes can be missed (or must be attended) for a chosen target. */
export function BunkCalculator() {
  const { subjects } = useApp();
  const [target, setTarget] = useState<number>(75);

  const rows = subjects
    .filter((s) => s.total > 0)
    .map((s) => ({
      code: s.code,
      name: s.name,
      pct: percent(s.present, s.total),
      canMiss: classesCanMiss(s.present, s.total, target),
      needed: classesNeeded(s.present, s.total, target),
    }));

  return (
    <div className="space-y-4">
      <div className="glass grid grid-cols-4 gap-1 rounded-2xl p-1">
        {THRESHOLDS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTarget(t)}
            className={cn(
              "tnum rounded-xl py-2 text-sm font-medium transition-colors",
              target === t ? "bg-ink text-ink-foreground shadow-soft" : "text-muted-foreground",
            )}
          >
            {t}%
          </button>
        ))}
      </div>

      {rows.length ? (
        <GlassCard className="divide-y divide-foreground/5 p-2">
          {rows.map((r) => (
            <div key={r.code} className="flex min-w-0 items-center gap-3 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <p className="tnum truncate text-xs text-muted-foreground">
                  {r.code} · {r.pct.toFixed(0)}%
                </p>
              </div>
              {r.canMiss > 0 ? (
                <span className="tnum shrink-0 text-right text-sm font-semibold text-good">
                  {r.canMiss}
                  <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    can miss
                  </span>
                </span>
              ) : (
                <span className="tnum shrink-0 text-right text-sm font-semibold text-bad">
                  {Number.isFinite(r.needed) ? r.needed : "—"}
                  <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    to attend
                  </span>
                </span>
              )}
            </div>
          ))}
        </GlassCard>
      ) : (
        <GlassCard className="p-8 text-center text-sm text-muted-foreground">
          Import your attendance to use the bunk calculator.
        </GlassCard>
      )}
    </div>
  );
}
