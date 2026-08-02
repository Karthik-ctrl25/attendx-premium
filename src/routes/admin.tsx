import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ShieldX } from "lucide-react";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { useClassSpace } from "@/lib/class-store";
import { getMyRole } from "@/lib/auth.functions";
import { ROLE_LABEL } from "@/lib/roles";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — AttendX" },
      {
        name: "description",
        content: "Admin console for AttendX: review Class Representative requests for your class.",
      },
      { property: "og:title", content: "Admin — AttendX" },
      {
        property: "og:description",
        content: "Review Class Representative requests and manage class roles in AttendX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  // Role is resolved on the server from the roles table — never from local state.
  const fetchRole = useServerFn(getMyRole);
  const { data, isLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => fetchRole({}),
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[700px]">
        <GlassCard className="h-24 animate-pulse">
          <span className="sr-only">Loading</span>
        </GlassCard>
      </div>
    );
  }

  if (data?.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-[700px]">
        <GlassCard className="flex items-center gap-3 p-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
            <ShieldX className="size-4 text-bad" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Admins only</p>
            <p className="text-xs text-muted-foreground">
              Signed in as {ROLE_LABEL[data?.role ?? "student"]}.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return <AdminConsole />;
}

function AdminConsole() {
  const { crRequests, reviewCrRequest } = useClassSpace();
  const pending = crRequests.filter((r) => r.status === "pending");

  return (
    <div className="mx-auto w-full max-w-[700px] space-y-3">
      <header className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <ShieldCheck className="size-4 text-good" />
        </span>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Admin</h1>
          <p className="text-[11.5px] text-muted-foreground">Verified server-side</p>
        </div>
      </header>

      <section>
        <SectionTitle title="CR requests" subtitle={`${pending.length} pending`} />
        {pending.length ? (
          <GlassCard className="divide-y divide-foreground/5 p-2">
            {pending.map((r) => (
              <div key={r.id} className="min-w-0 space-y-1.5 px-2.5 py-2.5">
                <p className="truncate text-sm font-semibold">
                  {r.name || "Student"} · {r.usn || "USN"}
                </p>
                <p className="text-xs text-muted-foreground">{r.reason}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={() => void reviewCrRequest(r.id, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => void reviewCrRequest(r.id, false)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </GlassCard>
        ) : (
          <GlassCard className="p-4 text-center text-sm text-muted-foreground">
            No pending requests.
          </GlassCard>
        )}
      </section>
    </div>
  );
}
