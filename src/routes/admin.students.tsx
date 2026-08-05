import { createFileRoute } from "@tanstack/react-router";

import { AdminStudents } from "@/components/admin/AdminStudents";

export const Route = createFileRoute("/admin/students")({
  component: () => (
    <section className="space-y-3.5">
      <h1 className="font-display text-xl font-semibold tracking-tight">Students</h1>
      <AdminStudents />
    </section>
  ),
});
