import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDrop } from "@/components/attendx/FileDrop";
import { SubjectsEditor, TimetableEditor } from "@/components/attendx/Editors";
import { TutorialVideo } from "@/components/attendx/TutorialVideo";
import { parseAttendance, parseSchedule, readImageText, subjectsFromTimetable } from "@/lib/ocr";
import { useApp } from "@/lib/store";
import type { ClassSlot, Subject } from "@/lib/types";

const STEP_LABELS = ["Welcome", "Tutorial", "Schedule", "Attendance", "Finish"];

export function Onboarding() {
  const { saveTimetable, saveSubjects, completeSetup } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [busy, setBusy] = useState<"schedule" | "attendance" | null>(null);
  const [status, setStatus] = useState("");

  const runOcr = async (file: File, kind: "schedule" | "attendance") => {
    setBusy(kind);
    setStatus("");
    try {
      const text = await readImageText(file, (stage, pct) => setStatus(`${stage} · ${pct}%`));
      if (kind === "schedule") {
        const parsed = parseSchedule(text);
        setSlots(parsed);
        setStatus(
          parsed.length
            ? `Extracted ${parsed.length} classes — review and edit below.`
            : "Nothing detected automatically. Add your classes manually below.",
        );
      } else {
        const parsed = parseAttendance(text);
        const merged = mergeSubjects(subjectsFromTimetable(slots), parsed);
        setSubjects(merged);
        setStatus(
          parsed.length
            ? `Extracted ${parsed.length} subjects — review and edit below.`
            : "Nothing detected automatically. Edit the subjects below.",
        );
      }
    } catch {
      setStatus("Could not read that screenshot. Try a clearer image or enter data manually.");
    } finally {
      setBusy(null);
    }
  };

  const next = () => {
    if (step === 2 && !subjects.length) setSubjects(subjectsFromTimetable(slots));
    setStatus("");
    setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1));
  };

  const finish = async () => {
    await saveTimetable(slots);
    await saveSubjects(subjects.length ? subjects : subjectsFromTimetable(slots));
    await completeSetup(name.trim());
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="grid size-9 place-items-center rounded-xl bg-[image:var(--gradient-ink)] text-ink-foreground shadow-soft">
          <Sparkles className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold tracking-tight">AttendX</p>
          <p className="text-[11px] text-muted-foreground">CMR University</p>
        </div>
      </div>

      <div className="mb-8 flex gap-1.5">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                i <= step ? "bg-foreground/70" : "bg-foreground/12"
              }`}
            />
            <p
              className={`mt-2 text-[10px] uppercase tracking-[0.14em] ${
                i <= step ? "text-foreground/70" : "text-muted-foreground/60"
              }`}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          {step === 0 ? (
            <div className="glass rounded-[32px] p-8 sm:p-10">
              <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Welcome to AttendX
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                This setup takes less than 2 minutes.
              </p>
              <p className="mt-6 max-w-md text-sm text-muted-foreground">
                Upload two screenshots from the CMR University ERP and AttendX builds your smart
                timetable and attendance tracker — fully offline, no login, no cloud.
              </p>
              <div className="mt-8 max-w-sm">
                <label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Your name (optional)
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditya"
                  className="mt-2 h-11 rounded-2xl border-white/70 bg-white/70"
                />
              </div>
            </div>
          ) : null}

          {step === 1 ? <TutorialVideo onSkip={next} /> : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Upload Schedule Screenshot
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  ERP → Schedule → select the week → screenshot → drop it here.
                </p>
              </div>
              <FileDrop
                onFile={(f) => runOcr(f, "schedule")}
                busy={busy === "schedule"}
                busyLabel="Extracting timetable"
                title="Drag & drop your schedule screenshot"
                hint="PNG, JPG or JPEG"
              />
              {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
              <TimetableEditor slots={slots} onChange={setSlots} />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Upload Attendance Screenshot
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  ERP → Attendance → screenshot → drop it here. Everything stays editable.
                </p>
              </div>
              <FileDrop
                onFile={(f) => runOcr(f, "attendance")}
                busy={busy === "attendance"}
                busyLabel="Extracting attendance"
                title="Drag & drop your attendance screenshot"
                hint="PNG, JPG or JPEG"
              />
              {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
              <SubjectsEditor
                subjects={subjects.length ? subjects : subjectsFromTimetable(slots)}
                onChange={setSubjects}
              />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="glass rounded-[32px] p-8 sm:p-10">
              <div className="grid size-12 place-items-center rounded-2xl bg-white/80 shadow-soft">
                <Check className="size-5 text-good" />
              </div>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight">
                You're all set{name ? `, ${name}` : ""}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {slots.length} classes · {(subjects.length || slots.length) && subjects.length}{" "}
                subjects saved to this device.
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                AttendX now works completely offline. You can edit subjects, timetable and counts
                anytime from your profile menu.
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="rounded-2xl"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        {step < STEP_LABELS.length - 1 ? (
          <Button className="rounded-2xl px-6" onClick={next}>
            Continue <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button className="rounded-2xl px-6" onClick={finish}>
            Finish setup <Check className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function mergeSubjects(base: Subject[], ocr: Subject[]) {
  const map = new Map(base.map((s) => [s.code, s]));
  for (const s of ocr) {
    const existing = map.get(s.code);
    map.set(s.code, existing ? { ...existing, ...s, name: s.name || existing.name } : s);
  }
  return [...map.values()];
}
