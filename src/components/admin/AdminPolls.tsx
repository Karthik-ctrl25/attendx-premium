import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pin, PinOff, Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { adminDeletePoll, adminListPolls, adminUpdatePoll } from "@/lib/admin.functions";

export function AdminPolls() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPolls);
  const update = useServerFn(adminUpdatePoll);
  const remove = useServerFn(adminDeletePoll);

  const { data: polls } = useQuery({ queryKey: ["admin", "polls"], queryFn: () => list({}) });
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin", "polls"] });

  return (
    <GlassCard className="divide-y divide-foreground/5 p-1.5">
      {(polls?.length ?? 0) === 0 ? (
        <p className="p-4 text-center text-[12.5px] text-muted-foreground">No polls yet.</p>
      ) : (
        polls!.map((p) => (
          <div key={p.id} className="flex items-center gap-2 px-2.5 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">
                {p.pinned ? "📌 " : ""}
                {p.question}
                {p.closed ? " · Closed" : ""}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {["Yes", "No", "Maybe"]
                  .map((c) => `${c} ${p.votes[c] ?? p.votes[c.toLowerCase()] ?? 0}`)
                  .join(" · ")}{" "}
                · {[p.department, p.semester, p.section].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-xl px-2.5"
                onClick={() =>
                  update({ data: { id: p.id, closed: !p.closed } })
                    .then(invalidate)
                    .catch(() => toast.error("Could not update the poll"))
                }
              >
                {p.closed ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-xl px-2.5"
                onClick={() =>
                  update({ data: { id: p.id, pinned: !p.pinned } })
                    .then(invalidate)
                    .catch(() => toast.error("Could not update the poll"))
                }
              >
                {p.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-xl px-2.5"
                onClick={() =>
                  remove({ data: { id: p.id } })
                    .then(invalidate)
                    .catch(() => toast.error("Could not delete the poll"))
                }
              >
                <Trash2 className="size-3.5 text-bad" />
              </Button>
            </div>
          </div>
        ))
      )}
    </GlassCard>
  );
}
