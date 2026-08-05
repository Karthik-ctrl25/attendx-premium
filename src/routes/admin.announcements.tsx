import { createFileRoute } from "@tanstack/react-router";

import { AdminAnnouncements } from "@/components/admin/AdminAnnouncements";

export const Route = createFileRoute("/admin/announcements")({
  component: () => (
    <section className="space-y-3.5">
      <h1 className="font-display text-xl font-semibold tracking-tight">Announcements</h1>
      <AdminAnnouncements />
    </section>
  ),
});
