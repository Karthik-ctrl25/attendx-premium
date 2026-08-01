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
    >
      <Link
        to="/attendance/$code"
        params={{ code: subject.code }}
        className="glass glass-hover block w-full min-w-0 rounded-3xl p-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-[15px] font-semibold tracking-tight">
              {subject.name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{subject.code}</p>
          </div>
          <span className={cn("tnum shrink-0 font-display text-xl font-semibold", TEXT[status])}>
            {subject.total ? `${pct.toFixed(0)}%` : "—"}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={cn("h-full rounded-full", BAR[status])}
          />
        </div>

        <div className="mt-3 flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="tnum truncate">
            Present <b className="font-semibold text-foreground">{subject.present}</b>
          </span>
          <span className="tnum truncate">
            Absent <b className="font-semibold text-foreground">{subject.absent}</b>
          </span>
          <span className="tnum truncate">
            Safe bunks <b className="font-semibold text-foreground">{safe}</b>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
