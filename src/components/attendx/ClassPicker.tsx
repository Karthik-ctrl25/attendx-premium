import { motion } from "framer-motion";
import { Check, CalendarCheck2, TriangleAlert } from "lucide-react";

import { DEPARTMENTS, SECTIONS, SEMESTERS, hasTimetableFor } from "@/lib/timetable-dataset";
import { cn } from "@/lib/utils";

export interface ClassChoice {
  department: string;
  semester: string;
  section: string;
}

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors",
        active ? "text-ink-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {active ? (
        <motion.span
          layoutId={`pill-${String(children)}`}
          className="absolute inset-0 rounded-2xl bg-[image:var(--gradient-ink)] shadow-soft"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}
      <span className="relative">{children}</span>
    </motion.button>
  );
}

export function ClassPicker({
  value,
  onChange,
}: {
  value: ClassChoice;
  onChange: (next: ClassChoice) => void;
}) {
  const complete = Boolean(value.department && value.semester && value.section);
  const found = complete && hasTimetableFor(value.department, value.semester, value.section);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[26px] font-semibold tracking-tight">
          Which class are you in?
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your timetable loads automatically — no schedule upload needed.
        </p>
      </div>

      <div className="glass space-y-2 rounded-[26px] p-4">
        <p className="px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Department
        </p>
        <div className="flex flex-col gap-1">
          {DEPARTMENTS.map((d) => {
            const active = value.department === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ ...value, department: d })}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-3.5 py-3 text-left text-sm font-medium transition-colors",
                  active ? "bg-white/80 shadow-soft" : "text-muted-foreground hover:bg-white/50",
                )}
              >
                {d}
                {active ? <Check className="size-4" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-[26px] p-4">
        <p className="px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Semester
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {SEMESTERS.map((s) => (
            <Pill
              key={s}
              active={value.semester === s}
              onClick={() => onChange({ ...value, semester: s })}
            >
              {s}
            </Pill>
          ))}
        </div>
      </div>

      <div className="glass rounded-[26px] p-4">
        <p className="px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Section
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {SECTIONS.map((s) => (
            <Pill
              key={s}
              active={value.section === s}
              onClick={() => onChange({ ...value, section: s })}
            >
              {s}
            </Pill>
          ))}
        </div>
      </div>

      {complete ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex items-start gap-3 rounded-[22px] p-4 text-sm"
        >
          {found ? (
            <>
              <CalendarCheck2 className="mt-0.5 size-4 text-good" />
              <p className="text-muted-foreground">
                Timetable found for {value.department} · Semester {value.semester} · Section{" "}
                {value.section}. It loads on the next step.
              </p>
            </>
          ) : (
            <>
              <TriangleAlert className="mt-0.5 size-4 text-warn" />
              <p className="text-muted-foreground">
                No timetable published for this class yet. You can continue — subjects will come
                from your attendance screenshot, and the timetable appears once it's added.
              </p>
            </>
          )}
        </motion.div>
      ) : null}
    </div>
  );
}
