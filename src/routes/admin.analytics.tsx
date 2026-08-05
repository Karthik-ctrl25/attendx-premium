import { createFileRoute } from "@tanstack/react-router";

import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";

export const Route = createFileRoute("/admin/analytics")({
  component: () => (
    <section className="space-y-3.5">
      <h1 className="font-display text-xl font-semibold tracking-tight">Analytics</h1>
      <AdminAnalyticsPanel />
    </section>
  ),
});
