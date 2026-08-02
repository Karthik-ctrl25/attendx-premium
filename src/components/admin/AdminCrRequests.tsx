import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { adminListCrRequests, adminReviewCrRequest } from "@/lib/admin.functions";

export function AdminCrRequests() {
  const qc = useQueryClient();
  const list = useServerFn(adminListCrRequests);
  const review = useServerFn(adminReviewCrRequest);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["admin", "cr-requests"],
    queryFn: () => list({}),
  });
  const pending = (rows ?? []).filter((r) => r.status === "pending");

  const act = (id: string, userId: string, approve: boolean) =>
    review({ data: { id, userId, approve } })
      .then(() => {
        void qc.invalidateQueries({ queryKey: ["admin"] });
        toast.success(approve ? "Approved as Class Representative" : "Request rejected");
      })
      .catch(() => toast.error("Could not review the request"));

  return (
    <GlassCard className="divide-y divide-foreground/5 p-1.5">
      {pending.length === 0 ? (
        <p className="p-4 text-center text-[12.5px] text-muted-foreground">
          No pending CR requests.
        </p>
      ) : (
        pending.map((r) => (
          <div key={r.id} className="space-y-1.5 px-2.5 py-2.5">
            <p className="truncate text-[13px] font-semibold">
              {r.name || "Student"} · {r.usn || "USN"}
            </p>
            <p className="text-[11.5px] text-muted-foreground">{r.reason}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="rounded-xl" onClick={() => act(r.id, r.user_id, true)}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-xl"
                onClick={() => act(r.id, r.user_id, false)}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
              >
                View profile
              </Button>
            </div>
            {openId === r.id ? (
              <dl className="rounded-2xl bg-foreground/[0.04] p-3 text-[12px]">
                {[
                  ["Name", r.name],
                  ["USN", r.usn],
                  ["Department", r.department],
                  ["Semester", r.semester],
                  ["Section", r.section],
                  ["Requested", new Date(r.created_at).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-0.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="truncate font-medium">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ))
      )}
    </GlassCard>
  );
}
