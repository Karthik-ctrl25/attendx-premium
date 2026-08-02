import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ShieldX } from "lucide-react";

import { GlassCard } from "@/components/attendx/GlassCard";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { AdminAnnouncements } from "@/components/admin/AdminAnnouncements";
import { AdminCrRequests } from "@/components/admin/AdminCrRequests";
import { AdminOverviewCards } from "@/components/admin/AdminOverviewCards";
import { AdminPolls } from "@/components/admin/AdminPolls";
import { AdminStudents } from "@/components/admin/AdminStudents";
import { AdminTimetable } from "@/components/admin/AdminTimetable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — AttendX" },
      {
        name: "description",
        content:
          "AttendX admin dashboard: manage students, timetables, announcements, polls and Class Representative requests.",
      },
      { property: "og:title", content: "Admin Dashboard — AttendX" },
      {
        property: "og:description",
        content: "Manage students, timetables, announcements, polls and class roles in AttendX.",
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => fetchRole({}),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <GlassCard className="h-24 animate-pulse">
          <span className="sr-only">Loading</span>
        </GlassCard>
      </div>
    );
  }

  if (isError || data?.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <GlassCard className="flex items-center gap-3 p-4">
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

  return <AdminConsole />;
}

function AdminConsole() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-3.5">
      <header className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-foreground/5">
          <ShieldCheck className="size-4 text-good" />
        </span>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-[11.5px] text-muted-foreground">
            Role verified server-side · every action is enforced by the backend
          </p>
        </div>
      </header>

      <AdminOverviewCards />

      <Tabs defaultValue="students" className="space-y-3">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-2xl">
          <TabsTrigger value="students" className="rounded-xl text-[12px]">
            Students
          </TabsTrigger>
          <TabsTrigger value="timetable" className="rounded-xl text-[12px]">
            Timetable
          </TabsTrigger>
          <TabsTrigger value="announcements" className="rounded-xl text-[12px]">
            Announcements
          </TabsTrigger>
          <TabsTrigger value="polls" className="rounded-xl text-[12px]">
            Polls
          </TabsTrigger>
          <TabsTrigger value="cr" className="rounded-xl text-[12px]">
            CR requests
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl text-[12px]">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <AdminStudents />
        </TabsContent>
        <TabsContent value="timetable">
          <AdminTimetable />
        </TabsContent>
        <TabsContent value="announcements">
          <AdminAnnouncements />
        </TabsContent>
        <TabsContent value="polls">
          <AdminPolls />
        </TabsContent>
        <TabsContent value="cr">
          <AdminCrRequests />
        </TabsContent>
        <TabsContent value="analytics">
          <AdminAnalyticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
