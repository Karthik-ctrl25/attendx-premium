import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, FileUp, Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminPublishTimetableDraft } from "@/lib/admin.functions";
import type { ClassScopeInput } from "@/lib/admin.types";
import {
  blockingIssues,
  draftId,
  extractTimetableFromFile,
  ISSUE_LABEL,
  lowConfidenceCount,
  NotTimetableError,
  validateSlots,
  type DraftSlot,
  type TimetableOcrStage,
} from "@/lib/ocr/timetable";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK = [1, 2, 3, 4, 5, 6, 0];

const selectClass =
  "h-9 w-full rounded-xl border border-foreground/10 bg-transparent px-2.5 text-[12px] text-foreground [&>option]:bg-background [&>option]:text-foreground";
const inputClass = "h-9 rounded-xl text-[12px]";

const emptyDraft = (): DraftSlot => ({
  id: draftId(),
  day: 1,
  start_time: "09:00",
  end_time: "10:00",
  code: "",
  name: "",
  faculty: "",
  room: "",
  session: "Theory",
  confidence: 100,
  issues: [],
});

const DraftRow = memo(function DraftRow({
  slot,
  onChange,
  onRemove,
}: {
  slot: DraftSlot;
  onChange: (next: DraftSlot) => void;
  onRemove: () => void;
}) {
  const bad = slot.issues.some((i) => i !== "low-confidence");
  const warn = slot.issues.includes("low-confidence");

  return (
    <div
      className={[
        "space-y-2 rounded-2xl border p-2.5",
        bad
          ? "border-bad/40 bg-bad/[0.06]"
          : warn
            ? "border-warn/40 bg-warn/[0.06]"
            : "border-foreground/10",
      ].join(" ")}
    >
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <select
          value={slot.day}
          onChange={(e) => onChange({ ...slot, day: Number(e.target.value) })}
          className={selectClass}
          aria-label="Day"
        >
          {WEEK.map((d) => (
            <option key={d} value={d}>
              {DAYS[d]}
            </option>
          ))}
        </select>
        <Input
          type="time"
          value={slot.start_time}
          onChange={(e) => onChange({ ...slot, start_time: e.target.value })}
          className={inputClass}
          aria-label="Start time"
        />
        <Input
          type="time"
          value={slot.end_time}
          onChange={(e) => onChange({ ...slot, end_time: e.target.value })}
          className={inputClass}
          aria-label="End time"
        />
        <select
          value={slot.session}
          onChange={(e) => onChange({ ...slot, session: e.target.value })}
          className={selectClass}
          aria-label="Session type"
        >
          <option value="Theory">Theory</option>
          <option value="Lab">Lab</option>
        </select>
        <Input
          value={slot.code}
          onChange={(e) => onChange({ ...slot, code: e.target.value })}
          placeholder="Subject code"
          className={inputClass}
        />
        <Input
          value={slot.name}
          onChange={(e) => onChange({ ...slot, name: e.target.value })}
          placeholder="Subject name"
          className={inputClass}
        />
        <Input
          value={slot.faculty}
          onChange={(e) => onChange({ ...slot, faculty: e.target.value })}
          placeholder="Faculty"
          className={inputClass}
        />
        <Input
          value={slot.room}
          onChange={(e) => onChange({ ...slot, room: e.target.value })}
          placeholder="Room / Lab"
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {slot.issues.map((issue) => (
          <span
            key={issue}
            className={[
              "rounded-full px-2 py-0.5 text-[10px]",
              issue === "low-confidence" ? "bg-warn/15 text-warn" : "bg-bad/15 text-bad",
            ].join(" ")}
          >
            {ISSUE_LABEL[issue]}
          </span>
        ))}
        {slot.confidence > 0 && slot.confidence < 100 ? (
          <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] text-muted-foreground">
            {slot.confidence}% confidence
          </span>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-8 rounded-xl px-2"
          onClick={onRemove}
          aria-label="Delete class"
        >
          <Trash2 className="size-3.5 text-bad" />
        </Button>
      </div>
    </div>
  );
});

export function AdminTimetableUpload({
  scope,
  onPublished,
}: {
  scope: ClassScopeInput;
  onPublished: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<TimetableOcrStage | null>(null);
  const [slots, setSlots] = useState<DraftSlot[]>([]);
  const [sourceName, setSourceName] = useState("");
  const publishDraft = useServerFn(adminPublishTimetableDraft);

  const errors = useMemo(() => blockingIssues(slots), [slots]);
  const lowConfidence = useMemo(() => lowConfidenceCount(slots), [slots]);

  const setValidated = useCallback(
    (next: DraftSlot[]) =>
      setSlots(validateSlots(next).sort((a, b) => a.day - b.day || a.start_time.localeCompare(b.start_time))),
    [],
  );

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setStage("Uploading...");
      try {
        const result = await extractTimetableFromFile(file, setStage);
        setSourceName(file.name);
        setSlots(result.slots);
        toast.success(`${result.slots.length} classes extracted — review before publishing`);
      } catch (error) {
        const message =
          error instanceof NotTimetableError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Could not read that file.";
        toast.error(message);
      } finally {
        setStage(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [],
  );

  const publish = useMutation({
    mutationFn: (replace: boolean) =>
      publishDraft({
        data: {
          ...scope,
          replace,
          slots: slots.map(({ id: _id, confidence: _c, issues: _i, ...rest }) => rest),
        },
      }),
    onSuccess: (_r, replace) => {
      setSlots([]);
      setSourceName("");
      onPublished();
      toast.success(
        replace ? "Timetable published to students" : "Classes added and published",
      );
    },
    onError: () => toast.error("Could not publish the timetable"),
  });

  const busy = stage !== null;

  return (
    <GlassCard className="space-y-3 p-3.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <SectionTitle title="Upload timetable" />
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Image, screenshot, photo or PDF. Nothing is saved until you press Publish.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 rounded-xl"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : (
            <FileUp className="mr-1 size-3.5" />
          )}
          {busy ? "Reading…" : "Upload"}
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      <AnimatePresence initial={false}>
        {busy ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[12px] text-muted-foreground"
          >
            {stage}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {slots.length ? (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-foreground/[0.04] px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-[12px] font-medium">
              {slots.length} classes · {sourceName || "draft"}
            </p>
            {errors ? (
              <span className="flex items-center gap-1 rounded-full bg-bad/15 px-2 py-0.5 text-[10px] text-bad">
                <AlertTriangle className="size-3" /> {errors} to fix
              </span>
            ) : null}
            {lowConfidence ? (
              <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[10px] text-warn">
                {lowConfidence} low confidence
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            {slots.map((slot) => (
              <DraftRow
                key={slot.id}
                slot={slot}
                onChange={(next) => setValidated(slots.map((s) => (s.id === next.id ? next : s)))}
                onRemove={() => setValidated(slots.filter((s) => s.id !== slot.id))}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl"
              onClick={() => setValidated([...slots, emptyDraft()])}
            >
              <Plus className="mr-1 size-3.5" /> Add class
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              disabled={errors > 0 || publish.isPending}
              onClick={() => publish.mutate(true)}
            >
              {publish.isPending ? (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
              ) : (
                <Send className="mr-1 size-3.5" />
              )}
              Publish (replace)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl"
              disabled={errors > 0 || publish.isPending}
              onClick={() => publish.mutate(false)}
            >
              <Check className="mr-1 size-3.5" /> Publish (append)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                setSlots([]);
                setSourceName("");
              }}
            >
              <X className="mr-1 size-3.5" /> Discard
            </Button>
          </div>
          {errors ? (
            <p className="text-[11.5px] text-bad">
              Fix the highlighted rows before publishing.
            </p>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  );
}
