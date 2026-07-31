import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { percent, statusOf } from "@/lib/attendance";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

const RING: Record<string, string> = {
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
  none: "text-muted-foreground",
};

const DOT: Record<string, string> = {
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
  none: "bg-primary",
};

export function SubjectCard({ subject, index = 0 }: { subject: Subject; index?: number }) {
  const pct = percent(subject.present, subject.total);
  const status = statusOf(pct, subject.total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/attendance/$code"
        params={{ code: subject.code }}
        className="glass glass-hover block rounded-3xl p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("size-1.5 rounded-full", DOT[status])} />
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {subject.code}
              </span>
            </div>
            <h3 className="mt-1.5 truncate font-display text-base font-semibold">{subject.name}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {subject.faculty || "Faculty not set"}
            </p>
          </div>
          <div className="text-right">
            <div className={cn("tnum font-display text-2xl font-semibold", RING[status])}>
              {subject.total ? `${pct.toFixed(0)}%` : "—"}
            </div>
            <ChevronRight className="ml-auto mt-1 size-4 text-muted-foreground" />
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "h-full rounded-full",
              status === "good" ? "bg-good" : status === "warn" ? "bg-warn" : "bg-bad",
            )}
          />
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="tnum">
            Present <b className="font-semibold text-foreground">{subject.present}</b>
          </span>
          <span className="tnum">
            Absent <b className="font-semibold text-foreground">{subject.absent}</b>
          </span>
          <span className="tnum">
            Total <b className="font-semibold text-foreground">{subject.total}</b>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
