import { createFileRoute } from "@tanstack/react-router";

import { AdminOverviewCards } from "@/components/admin/AdminOverviewCards";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <section className="space-y-3.5">
      <header>
        <h1 className="font-display text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-[11.5px] text-muted-foreground">
          Role verified server-side · every action is enforced by the backend
        </p>
      </header>
      <AdminOverviewCards />
    </section>
  );
}
