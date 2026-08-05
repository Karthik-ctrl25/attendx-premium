import { createFileRoute } from "@tanstack/react-router";

import { AdminPolls } from "@/components/admin/AdminPolls";

export const Route = createFileRoute("/admin/polls")({
  component: () => (
    <section className="space-y-3.5">
      <h1 className="font-display text-xl font-semibold tracking-tight">Polls</h1>
      <AdminPolls />
    </section>
  ),
});
