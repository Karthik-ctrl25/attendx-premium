import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldX } from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { GlassCard } from "@/components/attendx/GlassCard";
import { getMyRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — AttendX" },
      {
        name: "description",
        content:
          "AttendX admin console: manage students, timetables, announcements, polls and Class Representative requests.",
      },
      { property: "og:title", content: "Admin Console — AttendX" },
      {
        property: "og:description",
        content: "Manage students, timetables, announcements, polls and class roles in AttendX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  // Role is resolved on the server from the roles table — never from local state.
  const fetchRole = useServerFn(getMyRole);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => fetchRole({}),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <GlassCard className="h-24 w-full max-w-sm animate-pulse">
          <span className="sr-only">Loading</span>
        </GlassCard>
      </div>
    );
  }

  if (isError || data?.role !== "admin") {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <GlassCard className="flex w-full max-w-sm items-center gap-3 p-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-2xl bg-foreground/5">
            <ShieldX className="size-4 text-bad" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Access Denied</p>
            <p className="text-xs text-muted-foreground">
              This area is restricted to AttendX administrators.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
