import { createFileRoute } from "@tanstack/react-router";

import { AdminTimetableManager } from "@/components/admin/AdminTimetableManager";

export const Route = createFileRoute("/admin/timetables")({
  component: () => (
    <section className="space-y-3.5">
      <header>
        <h1 className="font-display text-xl font-semibold tracking-tight">Timetables</h1>
        <p className="text-[11.5px] text-muted-foreground">
          Published timetables reach every student in that Department, Semester and Section.
        </p>
      </header>
      <AdminTimetableManager />
    </section>
  ),
});
