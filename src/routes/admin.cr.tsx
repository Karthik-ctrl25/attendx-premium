import { createFileRoute } from "@tanstack/react-router";

import { AdminCrRequests } from "@/components/admin/AdminCrRequests";

export const Route = createFileRoute("/admin/cr")({
  component: () => (
    <section className="space-y-3.5">
      <h1 className="font-display text-xl font-semibold tracking-tight">CR Requests</h1>
      <AdminCrRequests />
    </section>
  ),
});
