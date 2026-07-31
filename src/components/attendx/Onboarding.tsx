import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthScreen } from "@/components/attendx/AuthScreen";
import { ClassPicker, type ClassChoice } from "@/components/attendx/ClassPicker";
import {
  AttendanceUploader,
  type ExtractResult,
} from "@/components/attendx/AttendanceUploader";
import { AttendanceReview } from "@/components/attendx/AttendanceReview";
import { TutorialVideo } from "@/components/attendx/TutorialVideo";
import { getTimetableFor } from "@/lib/timetable-dataset";
import { useApp } from "@/lib/store";
import type { ClassSlot, Subject } from "@/lib/types";

const STEPS = ["Your class", "Tutorial", "Attendance"];
const LOW_CONFIDENCE = 70;

export function Onboarding() {
  const { saveTimetable, saveSubjects, completeSetup, updateMeta, recordImport } = useApp();
  const [authed, setAuthed] = useState(false);
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<ClassChoice>({
    department: "",
    semester: "",
    section: "",
  });
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [extract, setExtract] = useState<ExtractResult | null>(null);
  const [saving, setSaving] = useState(false);

  if (!authed) return <AuthScreen onContinue={() => setAuthed(true)} />;

  const classReady = Boolean(choice.department && choice.semester && choice.section);
  const canContinue = step === 0 ? classReady : step === 1 ? true : subjects.length > 0;
  const isLast = step === STEPS.length - 1;

  const next = async () => {
    if (step === 0) {
      setSlots(getTimetableFor(choice.department, choice.semester, choice.section));
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    setSaving(true);
    try {
      await saveTimetable(slots);
      await saveSubjects(subjects);
      if (extract) {
        await recordImport({
          fileHash: extract.fileHash,
          dataHash: extract.dataHash,
          subjectCount: subjects.length,
          confidence: extract.confidence,
        });
      }
      await updateMeta({
        department: choice.department,
        semester: choice.semester,
        section: choice.section,
        authProvider: "google",
      });
      await completeSetup("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-2xl px-5 pb-40 pt-10 sm:px-6">
        <div className="mb-9 flex gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1 rounded-full transition-colors duration-500 ${
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
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 ? <ClassPicker value={choice} onChange={setChoice} /> : null}
            {step === 1 ? <TutorialVideo onSkip={() => setStep(2)} /> : null}
            {step === 2 ? (
              subjects.length ? (
                <AttendanceReview
                  subjects={subjects}
                  onChange={setSubjects}
                  lowConfidence={(extract?.confidence ?? 100) < LOW_CONFIDENCE}
                />
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-[26px] font-semibold tracking-tight">
                      Upload your attendance
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      ERP → Attendance → screenshot. Everything stays on your device.
                    </p>
                  </div>
                  <AttendanceUploader
                    existing={subjects}
                    onResult={(result) => {
                      setExtract(result);
                      setSubjects(result.subjects);
                    }}
                  />
                </div>
              )
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky footer — Continue is always reachable */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="pointer-events-none h-16 bg-gradient-to-t from-background to-transparent" />
        <div className="glass-strong border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-end">
            <Button
              className="h-12 w-full rounded-2xl px-8 text-[15px] sm:w-auto"
              disabled={!canContinue || saving}
              onClick={next}
            >
              {isLast ? (
                <>
                  Save & Finish <Check className="size-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
