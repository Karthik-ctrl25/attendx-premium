import { AnimatePresence, motion } from "framer-motion";
import { Check, CloudUpload, Loader2, TriangleAlert } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { findDuplicate, hashFile, hashSubjects, mergeSubjects } from "@/lib/attendance-import";
import {
  extractAttendanceFromImage,
  NOT_CMR_MESSAGE,
  NotCmrScreenshotError,
  OCR_STAGES,
  type OcrStage,
} from "@/lib/ocr";
import { useApp } from "@/lib/store";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/png", "image/jpeg", "image/jpg"];

const STAGES = OCR_STAGES;

export interface ExtractResult {
  subjects: Subject[];
  fileHash: string;
  dataHash: string;
  confidence: number;
}


export function AttendanceUploader({
  existing,
  onResult,
}: {
  existing: Subject[];
  onResult: (result: ExtractResult) => void;
}) {
  const { imports } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<ExtractResult | null>(null);
  const [duplicateKind, setDuplicateKind] = useState<"file" | "data" | null>(null);

  const run = useCallback(
    async (file?: File | null) => {
      if (!file) return;
      if (!ACCEPT.includes(file.type)) {
        setError("Only PNG, JPG and JPEG screenshots are supported.");
        return;
      }
      setError("");
      setBusy(true);
      setStage(0);
      try {
        const [fileHash, extraction] = await Promise.all([
          hashFile(file),
          extractAttendanceFromImage(file, (s: OcrStage) => {
            const index = STAGES.indexOf(s);
            if (index >= 0) setStage(index);
          }),
        ]);
        const subjects = extraction.subjects;
        const dataHash = await hashSubjects(subjects);
        const result: ExtractResult = {
          subjects,
          fileHash,
          dataHash,
          confidence: extraction.confidence,
        };

        const dup = subjects.length ? findDuplicate(imports, fileHash, dataHash) : null;
        if (dup) {
          setPending(result);
          setDuplicateKind(dup.kind);
        } else if (!subjects.length) {
          setError(
            "We couldn't find an attendance table in that screenshot. Upload the full ERP attendance page.",
          );
        } else {
          onResult(result);
        }
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Could not read that screenshot. Try a clearer image.",
        );
      } finally {
        setBusy(false);
      }
    },
    [imports, onResult],
  );


  return (
    <div className="space-y-4">
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void run(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "glass relative flex flex-col items-center justify-center gap-5 rounded-[32px] border-dashed px-6 py-16 text-center transition-all duration-300",
          over && "scale-[1.01] border-foreground/25 bg-white/70 shadow-float",
        )}
      >
        <AnimatePresence mode="wait">
          {busy ? (
            <motion.div
              key="busy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="relative grid size-20 place-items-center">
                <motion.span
                  className="absolute inset-0 rounded-full border border-foreground/10"
                  animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="grid size-16 place-items-center rounded-full bg-white/80 shadow-soft">
                  <Loader2 className="size-7 animate-spin text-muted-foreground" />
                </span>
              </div>
              <div className="h-6 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stage}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="font-display text-base font-semibold"
                  >
                    {STAGES[stage]}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="flex gap-1.5">
                {STAGES.map((s, i) => (
                  <span
                    key={s}
                    className={cn(
                      "h-1 w-6 rounded-full transition-colors",
                      i <= stage ? "bg-foreground/60" : "bg-foreground/12",
                    )}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-5"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="grid size-20 place-items-center rounded-[26px] bg-white/75 shadow-soft"
              >
                <CloudUpload className="size-9 text-muted-foreground" />
              </motion.div>
              <div>
                <p className="font-display text-xl font-semibold tracking-tight">
                  Drop Attendance Screenshot Here
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  or
                </p>
              </div>
              <Button
                className="rounded-2xl px-6"
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground">Supported · PNG · JPG · JPEG</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          void run(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error ? (
        <div className="glass flex items-start gap-2.5 rounded-2xl p-3.5 text-sm">
          <TriangleAlert className="mt-0.5 size-4 text-bad" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : null}

      <AnimatePresence>
        {pending && duplicateKind ? (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[3px]"
            />
            <motion.div
              key="dialog"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              role="dialog"
              aria-modal="true"
              className="glass-strong fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[28px] p-6"
            >
              <div className="grid size-11 place-items-center rounded-2xl bg-white/80 shadow-soft">
                <Check className="size-5 text-warn" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
                You already imported this attendance.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {duplicateKind === "file"
                  ? "This is the same screenshot you imported earlier."
                  : "This screenshot contains the same attendance data you already saved."}{" "}
                Choose how to continue — nothing is overwritten without your confirmation.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  className="rounded-2xl"
                  onClick={() => {
                    onResult(pending);
                    setPending(null);
                    setDuplicateKind(null);
                  }}
                >
                  Replace existing data
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => {
                    onResult({
                      ...pending,
                      subjects: mergeSubjects(existing, pending.subjects),
                    });
                    setPending(null);
                    setDuplicateKind(null);
                  }}
                >
                  Merge with existing
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-2xl"
                  onClick={() => {
                    setPending(null);
                    setDuplicateKind(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
