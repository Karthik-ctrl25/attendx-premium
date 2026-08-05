import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminTimetableUpload } from "@/components/admin/AdminTimetableUpload";
import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminAddTimetableSlot,
  adminDeleteTimetableSlot,
  adminListClassScopes,
  adminListTimetable,
  adminPublishTimetable,
  adminUpdateTimetableSlot,
} from "@/lib/admin.functions";
import type { TimetableSlotRow } from "@/lib/admin.types";
import { DEPARTMENTS, SECTIONS, SEMESTERS } from "@/lib/timetable-dataset";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK = [1, 2, 3, 4, 5, 6, 0];

const emptySlot = {
  day: 1,
  start_time: "09:00",
  end_time: "10:00",
  code: "",
  name: "",
  faculty: "",
  room: "",
  session: "Theory",
};
type SlotDraft = typeof emptySlot;

const selectClass =
  "h-10 w-full rounded-2xl border border-foreground/10 bg-transparent px-3 text-[12.5px]";

function SlotForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  pending,
}: {
  value: SlotDraft;
  onChange: (v: SlotDraft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  pending?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <select
          value={value.day}
          onChange={(e) => onChange({ ...value, day: Number(e.target.value) })}
          className={selectClass}
        >
          {WEEK.map((d) => (
            <option key={d} value={d}>
              {DAYS[d]}
            </option>
          ))}
        </select>
        <Input
          type="time"
          value={value.start_time}
          onChange={(e) => onChange({ ...value, start_time: e.target.value })}
          className="h-10 rounded-2xl text-[12.5px]"
        />
        <Input
          type="time"
          value={value.end_time}
          onChange={(e) => onChange({ ...value, end_time: e.target.value })}
          className="h-10 rounded-2xl text-[12.5px]"
        />
        <select
          value={value.session}
          onChange={(e) => onChange({ ...value, session: e.target.value })}
          className={selectClass}
        >
          <option value="Theory">Theory</option>
          <option value="Lab">Lab</option>
        </select>
        <Input
          value={value.code}
          onChange={(e) => onChange({ ...value, code: e.target.value })}
          placeholder="Subject code"
          className="h-10 rounded-2xl text-[12.5px]"
        />
        <Input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Subject name"
          className="h-10 rounded-2xl text-[12.5px]"
        />
        <Input
          value={value.faculty}
          onChange={(e) => onChange({ ...value, faculty: e.target.value })}
          placeholder="Faculty"
          className="h-10 rounded-2xl text-[12.5px]"
        />
        <Input
          value={value.room}
          onChange={(e) => onChange({ ...value, room: e.target.value })}
          placeholder="Room"
          className="h-10 rounded-2xl text-[12.5px]"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="rounded-xl"
          disabled={!value.code.trim() || pending}
          onClick={onSubmit}
        >
          <Check className="mr-1 size-3.5" /> {submitLabel}
        </Button>
        {onCancel ? (
          <Button size="sm" variant="ghost" className="rounded-xl" onClick={onCancel}>
            <X className="mr-1 size-3.5" /> Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function AdminTimetableManager() {
  const qc = useQueryClient();
  const listScopes = useServerFn(adminListClassScopes);
  const list = useServerFn(adminListTimetable);
  const add = useServerFn(adminAddTimetableSlot);
  const update = useServerFn(adminUpdateTimetableSlot);
  const remove = useServerFn(adminDeleteTimetableSlot);
  const publish = useServerFn(adminPublishTimetable);

  const [scope, setScope] = useState({ department: "", semester: "", section: "" });
  const [draft, setDraft] = useState<SlotDraft>({ ...emptySlot });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SlotDraft>({ ...emptySlot });

  const ready = Boolean(scope.department && scope.semester && scope.section);

  const { data: scopes } = useQuery({ queryKey: ["admin", "scopes"], queryFn: () => listScopes({}) });
  const { data: slots, isLoading } = useQuery({
    queryKey: ["admin", "timetable", scope],
    queryFn: () => list({ data: scope }),
    enabled: ready,
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin", "timetable"] });

  const addSlot = useMutation({
    mutationFn: () => add({ data: { ...scope, ...draft } }),
    onSuccess: () => {
      invalidate();
      setDraft({ ...emptySlot });
      setAdding(false);
      toast.success("Class added");
    },
    onError: () => toast.error("Could not add the class"),
  });

  const editSlot = useMutation({
    mutationFn: () => update({ data: { id: editingId!, ...editDraft } }),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast.success("Class updated");
    },
    onError: () => toast.error("Could not update the class"),
  });

  const deleteSlot = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Class removed");
    },
    onError: () => toast.error("Could not delete the class"),
  });

  const publishAll = useMutation({
    mutationFn: (published: boolean) => publish({ data: { ...scope, published } }),
    onSuccess: (_r, published) => {
      invalidate();
      toast.success(published ? "Published to students" : "Unpublished");
    },
    onError: () => toast.error("Could not change the publish state"),
  });

  const startEdit = (s: TimetableSlotRow) => {
    setEditingId(s.id);
    setEditDraft({
      day: s.day,
      start_time: s.start_time,
      end_time: s.end_time,
      code: s.code,
      name: s.name,
      faculty: s.faculty,
      room: s.room,
      session: s.session,
    });
  };

  const rows = slots ?? [];
  const publishedCount = rows.filter((s) => s.published).length;

  const departments = [
    ...new Set([...DEPARTMENTS, ...(scopes ?? []).map((s) => s.department)]),
  ].sort();
  const semesters = [...new Set([...SEMESTERS, ...(scopes ?? []).map((s) => s.semester)])].sort();
  const sections = [...new Set([...SECTIONS, ...(scopes ?? []).map((s) => s.section)])].sort();

  return (
    <div className="space-y-3">
      <GlassCard className="space-y-2.5 p-3.5">
        <SectionTitle title="Select a class" />
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            value={scope.department}
            onChange={(e) =>
              setScope({ department: e.target.value, semester: "", section: "" })
            }
            className={selectClass}
          >
            <option value="">Department…</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={scope.semester}
            disabled={!scope.department}
            onChange={(e) => setScope({ ...scope, semester: e.target.value, section: "" })}
            className={selectClass}
          >
            <option value="">Semester…</option>
            {semesters.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
          <select
            value={scope.section}
            disabled={!scope.semester}
            onChange={(e) => setScope({ ...scope, section: e.target.value })}
            className={selectClass}
          >
            <option value="">Section…</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {!ready ? (
        <GlassCard className="p-6 text-center text-[12.5px] text-muted-foreground">
          Pick a Department, Semester and Section to build its weekly timetable.
        </GlassCard>
      ) : (
        <>
          <AdminTimetableUpload scope={scope} onPublished={invalidate} />

          <GlassCard className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3.5">
            <div className="min-w-0">


              <p className="truncate text-[13px] font-semibold">
                {scope.department} · Sem {scope.semester} · {scope.section}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {rows.length} classes · {publishedCount} published
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button
                size="sm"
                className="rounded-xl"
                disabled={rows.length === 0 || publishAll.isPending}
                onClick={() => publishAll.mutate(true)}
              >
                <Send className="mr-1 size-3.5" /> Publish
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl"
                disabled={rows.length === 0}
                onClick={() => publishAll.mutate(false)}
              >
                Unpublish
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="space-y-2.5 p-3.5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <SectionTitle title="Add a class" />
              <Button
                size="sm"
                variant={adding ? "ghost" : "secondary"}
                className="shrink-0 rounded-xl"
                onClick={() => setAdding((v) => !v)}
              >
                {adding ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              </Button>
            </div>
            {adding ? (
              <SlotForm
                value={draft}
                onChange={setDraft}
                onSubmit={() => addSlot.mutate()}
                onCancel={() => setAdding(false)}
                submitLabel="Add class"
                pending={addSlot.isPending}
              />
            ) : null}
          </GlassCard>

          {isLoading ? (
            <GlassCard className="p-6 text-center text-[12.5px] text-muted-foreground">
              Loading timetable…
            </GlassCard>
          ) : rows.length === 0 ? (
            <GlassCard className="p-6 text-center text-[12.5px] text-muted-foreground">
              No classes yet for this section.
            </GlassCard>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {WEEK.filter((d) => rows.some((s) => s.day === d)).map((day) => (
                <GlassCard key={day} className="space-y-1.5 p-3">
                  <p className="px-1 text-[12px] font-semibold text-muted-foreground">
                    {DAYS[day]}
                  </p>
                  <div className="divide-y divide-foreground/5">
                    {rows
                      .filter((s) => s.day === day)
                      .map((s) => (
                        <div key={s.id} className="py-2">
                          {editingId === s.id ? (
                            <SlotForm
                              value={editDraft}
                              onChange={setEditDraft}
                              onSubmit={() => editSlot.mutate()}
                              onCancel={() => setEditingId(null)}
                              submitLabel="Save"
                              pending={editSlot.isPending}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold">
                                  {s.code} · {s.name}
                                </p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {s.start_time}–{s.end_time} · {s.session}
                                  {s.room ? ` · ${s.room}` : ""}
                                  {s.faculty ? ` · ${s.faculty}` : ""}
                                </p>
                              </div>
                              <span
                                className={
                                  s.published
                                    ? "shrink-0 rounded-full bg-good/15 px-2 py-0.5 text-[10px] text-good"
                                    : "shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] text-muted-foreground"
                                }
                              >
                                {s.published ? "Live" : "Draft"}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 shrink-0 rounded-xl px-2"
                                onClick={() => startEdit(s)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 shrink-0 rounded-xl px-2"
                                onClick={() => deleteSlot.mutate(s.id)}
                              >
                                <Trash2 className="size-3.5 text-bad" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
