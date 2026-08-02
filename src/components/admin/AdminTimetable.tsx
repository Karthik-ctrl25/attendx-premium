import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminAddTimetableSlot,
  adminDeleteTimetableSlot,
  adminListTimetable,
  adminPublishTimetable,
} from "@/lib/admin.functions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

export function AdminTimetable() {
  const qc = useQueryClient();
  const list = useServerFn(adminListTimetable);
  const add = useServerFn(adminAddTimetableSlot);
  const remove = useServerFn(adminDeleteTimetableSlot);
  const publish = useServerFn(adminPublishTimetable);

  const [scope, setScope] = useState({ department: "", semester: "", section: "" });
  const [draft, setDraft] = useState({ ...emptySlot });
  const ready = Boolean(scope.department && scope.semester && scope.section);

  const { data: slots } = useQuery({
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
      toast.success("Slot added");
    },
    onError: () => toast.error("Could not add the slot"),
  });

  const publishAll = useMutation({
    mutationFn: (published: boolean) => publish({ data: { ...scope, published } }),
    onSuccess: (_r, published) => {
      invalidate();
      toast.success(published ? "Timetable published to students" : "Timetable unpublished");
    },
    onError: () => toast.error("Could not publish the timetable"),
  });

  return (
    <div className="space-y-3">
      <GlassCard className="grid grid-cols-3 gap-2 p-3.5">
        <Input
          value={scope.department}
          onChange={(e) => setScope({ ...scope, department: e.target.value })}
          placeholder="Department"
          className="h-9 rounded-2xl text-[12.5px]"
        />
        <Input
          value={scope.semester}
          onChange={(e) => setScope({ ...scope, semester: e.target.value })}
          placeholder="Semester"
          className="h-9 rounded-2xl text-[12.5px]"
        />
        <Input
          value={scope.section}
          onChange={(e) => setScope({ ...scope, section: e.target.value })}
          placeholder="Section"
          className="h-9 rounded-2xl text-[12.5px]"
        />
      </GlassCard>

      {!ready ? (
        <GlassCard className="p-4 text-center text-[12.5px] text-muted-foreground">
          Enter a department, semester and section to build its timetable.
        </GlassCard>
      ) : (
        <>
          <GlassCard className="space-y-2 p-3.5">
            <SectionTitle title="Add subject slot" />
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <select
                value={draft.day}
                onChange={(e) => setDraft({ ...draft, day: Number(e.target.value) })}
                className="h-9 rounded-2xl border border-foreground/10 bg-transparent px-3 text-[12.5px]"
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
              <Input
                type="time"
                value={draft.start_time}
                onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                className="h-9 rounded-2xl text-[12.5px]"
              />
              <Input
                type="time"
                value={draft.end_time}
                onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
                className="h-9 rounded-2xl text-[12.5px]"
              />
              <select
                value={draft.session}
                onChange={(e) => setDraft({ ...draft, session: e.target.value })}
                className="h-9 rounded-2xl border border-foreground/10 bg-transparent px-3 text-[12.5px]"
              >
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
              </select>
              <Input
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                placeholder="Subject code"
                className="h-9 rounded-2xl text-[12.5px]"
              />
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Subject name"
                className="h-9 rounded-2xl text-[12.5px]"
              />
              <Input
                value={draft.faculty}
                onChange={(e) => setDraft({ ...draft, faculty: e.target.value })}
                placeholder="Faculty"
                className="h-9 rounded-2xl text-[12.5px]"
              />
              <Input
                value={draft.room}
                onChange={(e) => setDraft({ ...draft, room: e.target.value })}
                placeholder="Room"
                className="h-9 rounded-2xl text-[12.5px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-xl"
                disabled={!draft.code.trim() || addSlot.isPending}
                onClick={() => addSlot.mutate()}
              >
                <Plus className="mr-1 size-3.5" /> Add slot
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-xl"
                onClick={() => publishAll.mutate(true)}
              >
                <Send className="mr-1 size-3.5" /> Publish
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl"
                onClick={() => publishAll.mutate(false)}
              >
                Unpublish
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="divide-y divide-foreground/5 p-1.5">
            {(slots?.length ?? 0) === 0 ? (
              <p className="p-4 text-center text-[12.5px] text-muted-foreground">
                No slots yet for this class.
              </p>
            ) : (
              slots!.map((s) => (
                <div key={s.id} className="flex items-center gap-2 px-2.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">
                      {s.code} · {s.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {DAYS[s.day]} · {s.start_time}–{s.end_time} · {s.session}
                      {s.room ? ` · ${s.room}` : ""}
                      {s.faculty ? ` · ${s.faculty}` : ""}
                      {s.published ? " · Published" : " · Draft"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 rounded-xl px-2.5"
                    onClick={() =>
                      remove({ data: { id: s.id } })
                        .then(invalidate)
                        .catch(() => toast.error("Could not delete the slot"))
                    }
                  >
                    <Trash2 className="size-3.5 text-bad" />
                  </Button>
                </div>
              ))
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}
