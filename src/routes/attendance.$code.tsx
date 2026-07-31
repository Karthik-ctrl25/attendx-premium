import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AttendanceRing } from "@/components/attendx/AttendanceRing";
import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { THRESHOLDS, classesCanMiss, classesNeeded, percent } from "@/lib/attendance";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/attendance/$code")({
  head: () => ({
    meta: [
      { title: "Subject detail — AttendX" },
      {
        name: "description",
        content: "Detailed attendance for a single subject with targets and full history.",
      },
      { property: "og:title", content: "Subject detail — AttendX" },
      {
        property: "og:description",
        content: "Present, absent, totals, targets and history for one subject.",
      },
    ],
  }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { subjects, history, mark, undo, updateSubject, resetSubject, removeSubject } = useApp();
  const [editing, setEditing] = useState(false);

  const subject = subjects.find((s) => s.code === code);

  if (!subject) {
    return (
      <GlassCard className="mt-10 p-10 text-center">
        <p className="font-display text-lg font-semibold">Subject not found</p>
        <Button asChild variant="secondary" className="mt-5 rounded-2xl">
          <Link to="/attendance">Back to attendance</Link>
        </Button>
      </GlassCard>
    );
  }

  const pct = percent(subject.present, subject.total);
  const entries = history.filter((h) => h.code === code);

  return (
    <div className="space-y-6">
      <Link
        to="/attendance"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Attendance
      </Link>

      <header>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {subject.code}
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{subject.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subject.faculty || "Faculty not set"}</p>
      </header>

      <GlassCard strong className="flex flex-wrap items-center gap-8 p-7">
        <AttendanceRing value={pct} total={subject.total} size={148} sublabel={subject.code} />
        <div className="grid flex-1 grid-cols-3 gap-3 text-center">
          {[
            { label: "Present", value: subject.present },
            { label: "Absent", value: subject.absent },
            { label: "Total", value: subject.total },
          ].map((x) => (
            <div key={x.label} className="rounded-2xl bg-white/60 py-4">
              <p className="tnum font-display text-2xl font-semibold">{x.value}</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {x.label}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-2">
        <Button
          className="rounded-2xl"
          onClick={async () => {
            await mark(subject.code, "present");
            toast.success("Marked present");
          }}
        >
          <Check className="size-4" /> Present
        </Button>
        <Button
          variant="destructive"
          className="rounded-2xl"
          onClick={async () => {
            await mark(subject.code, "absent");
            toast("Marked absent");
          }}
        >
          <X className="size-4" /> Absent
        </Button>
        <Button variant="secondary" className="rounded-2xl" onClick={() => setEditing((e) => !e)}>
          <Pencil className="size-4" /> Edit
        </Button>
        <Button
          variant="secondary"
          className="rounded-2xl"
          onClick={async () => {
            await resetSubject(subject.code);
            toast("Subject reset");
          }}
        >
          <RotateCcw className="size-4" /> Reset
        </Button>
        <Button
          variant="ghost"
          className="rounded-2xl text-muted-foreground hover:text-bad"
          onClick={async () => {
            await removeSubject(subject.code);
            toast("Subject deleted");
            navigate({ to: "/attendance" });
          }}
        >
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      {editing ? (
        <GlassCard className="grid gap-3 p-5 sm:grid-cols-3">
          <label className="text-xs text-muted-foreground">
            Name
            <Input
              className="mt-1 h-9 rounded-xl border-white/70 bg-white/70"
              value={subject.name}
              onChange={(e) => updateSubject(subject.code, { name: e.target.value })}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Faculty
            <Input
              className="mt-1 h-9 rounded-xl border-white/70 bg-white/70"
              value={subject.faculty}
              onChange={(e) => updateSubject(subject.code, { faculty: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["present", "absent", "total"] as const).map((k) => (
              <label key={k} className="text-xs capitalize text-muted-foreground">
                {k}
                <Input
                  type="number"
                  min={0}
                  className="mt-1 h-9 rounded-xl border-white/70 bg-white/70"
                  value={subject[k]}
                  onChange={(e) =>
                    updateSubject(subject.code, { [k]: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </label>
            ))}
          </div>
        </GlassCard>
      ) : null}

      <section>
        <SectionTitle title="Targets" subtitle="Consecutive classes, assuming no other changes" />
        <div className="grid gap-3 sm:grid-cols-4">
          {THRESHOLDS.map((t) => {
            const need = classesNeeded(subject.present, subject.total, t);
            const miss = classesCanMiss(subject.present, subject.total, t);
            return (
              <GlassCard key={t} className="p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t}% target
                </p>
                <p className="tnum mt-2 font-display text-2xl font-semibold">
                  {need > 0 ? `+${need}` : "Safe"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {need > 0 ? "classes to attend" : `can miss ${miss}`}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle title="History" subtitle={`${entries.length} entries`} />
        <GlassCard className="divide-y divide-white/60 p-2">
          {entries.map((h) => (
            <div key={h.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium capitalize">{h.action}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(h.ts).toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl text-muted-foreground"
                onClick={() => undo(h.id)}
              >
                Undo
              </Button>
            </div>
          ))}
          {!entries.length ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No entries yet.</p>
          ) : null}
        </GlassCard>
      </section>
    </div>
  );
}
