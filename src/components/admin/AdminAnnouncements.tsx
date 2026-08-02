import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pin, PinOff, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminDeleteAnnouncement,
  adminListAnnouncements,
  adminSaveAnnouncement,
  adminSetAnnouncementPinned,
} from "@/lib/admin.functions";

export function AdminAnnouncements() {
  const qc = useQueryClient();
  const list = useServerFn(adminListAnnouncements);
  const save = useServerFn(adminSaveAnnouncement);
  const setPinned = useServerFn(adminSetAnnouncementPinned);
  const remove = useServerFn(adminDeleteAnnouncement);

  const [draft, setDraft] = useState({
    id: "",
    title: "",
    body: "",
    department: "",
    semester: "",
    section: "",
  });

  const { data: rows } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => list({}),
  });
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin", "announcements"] });

  const submit = useMutation({
    mutationFn: () =>
      save({
        data: draft.id
          ? { id: draft.id, title: draft.title, body: draft.body }
          : {
              title: draft.title,
              body: draft.body,
              department: draft.department,
              semester: draft.semester,
              section: draft.section,
            },
      }),
    onSuccess: () => {
      invalidate();
      setDraft({ id: "", title: "", body: "", department: "", semester: "", section: "" });
      toast.success("Announcement saved");
    },
    onError: () => toast.error("Could not save the announcement"),
  });

  const targetReady = draft.id
    ? true
    : Boolean(draft.department && draft.semester && draft.section);

  return (
    <div className="space-y-3">
      <GlassCard className="space-y-2 p-3.5">
        <SectionTitle title={draft.id ? "Edit announcement" : "New announcement"} />
        <Input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Title"
          className="h-9 rounded-2xl text-[12.5px]"
        />
        <Textarea
          rows={3}
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          placeholder="Message"
          className="rounded-2xl text-[12.5px]"
        />
        {draft.id ? null : (
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={draft.department}
              onChange={(e) => setDraft({ ...draft, department: e.target.value })}
              placeholder="Department"
              className="h-9 rounded-2xl text-[12.5px]"
            />
            <Input
              value={draft.semester}
              onChange={(e) => setDraft({ ...draft, semester: e.target.value })}
              placeholder="Semester"
              className="h-9 rounded-2xl text-[12.5px]"
            />
            <Input
              value={draft.section}
              onChange={(e) => setDraft({ ...draft, section: e.target.value })}
              placeholder="Section"
              className="h-9 rounded-2xl text-[12.5px]"
            />
          </div>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="rounded-xl"
            disabled={!draft.title.trim() || !targetReady || submit.isPending}
            onClick={() => submit.mutate()}
          >
            <Plus className="mr-1 size-3.5" /> {draft.id ? "Save changes" : "Post announcement"}
          </Button>
          {draft.id ? (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl"
              onClick={() =>
                setDraft({ id: "", title: "", body: "", department: "", semester: "", section: "" })
              }
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard className="divide-y divide-foreground/5 p-1.5">
        {(rows?.length ?? 0) === 0 ? (
          <p className="p-4 text-center text-[12.5px] text-muted-foreground">
            No announcements yet.
          </p>
        ) : (
          rows!.map((a) => (
            <div key={a.id} className="flex items-center gap-2 px-2.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">
                  {a.pinned ? "📌 " : ""}
                  {a.title}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {[a.department, a.semester, a.section].filter(Boolean).join(" · ")} ·{" "}
                  {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-xl px-2.5"
                  onClick={() =>
                    setDraft({
                      id: a.id,
                      title: a.title,
                      body: a.body,
                      department: a.department,
                      semester: a.semester,
                      section: a.section,
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-xl px-2.5"
                  onClick={() =>
                    setPinned({ data: { id: a.id, pinned: !a.pinned } })
                      .then(invalidate)
                      .catch(() => toast.error("Could not update the pin"))
                  }
                >
                  {a.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-xl px-2.5"
                  onClick={() =>
                    remove({ data: { id: a.id } })
                      .then(invalidate)
                      .catch(() => toast.error("Could not delete the announcement"))
                  }
                >
                  <Trash2 className="size-3.5 text-bad" />
                </Button>
              </div>
            </div>
          ))
        )}
      </GlassCard>
    </div>
  );
}
