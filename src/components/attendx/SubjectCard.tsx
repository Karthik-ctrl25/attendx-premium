import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { classesCanMiss, percent, statusOf } from "@/lib/attendance";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEXT: Record<string, string> = {
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
  none: "text-muted-foreground",
};

const BAR: Record<string, string> = {
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
  none: "bg-primary",
};

export function SubjectCard({ subject, index = 0 }: { subject: Subject; index?: number }) {
  const pct = percent(subject.present, subject.total);
  const status = statusOf(pct, subject.total);
  const safe = classesCanMiss(subject.present, subject.total, 75);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link
        to="/attendance/$code"
        params={{ code: subject.code }}
        className="glass glass-hover flex h-full w-full min-w-0 flex-col rounded-3xl p-4"
      >
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[15px] font-semibold leading-snug tracking-tight">
              {subject.name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {subject.faculty || subject.code}
            </p>
          </div>
          <span
            className={cn(
              "tnum shrink-0 whitespace-nowrap font-display text-xl font-semibold leading-none",
              TEXT[status],
            )}
          >
            {subject.total ? `${pct.toFixed(0)}%` : "—"}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </div>

        <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={cn("h-full rounded-full", BAR[status])}
          />
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2 pt-3.5">
          {[
            { label: "Present", value: subject.present },
            { label: "Absent", value: subject.absent },
            { label: "Safe bunks", value: safe },
          ].map((x) => (
            <div key={x.label} className="min-w-0 rounded-2xl bg-white/60 px-2 py-2 text-center">
              <p className="tnum font-display text-base font-semibold leading-none">{x.value}</p>
              <p className="mt-1 truncate text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                {x.label}
              </p>
            </div>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}
