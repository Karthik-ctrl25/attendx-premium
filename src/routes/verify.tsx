import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppShell } from "@/components/attendx/AppShell";
import { VerifyAttendance } from "@/components/attendx/VerifyAttendance";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Verify Attendance · AttendX" },
      {
        name: "description",
        content:
          "Cross-check your AttendX records against a fresh CMR University ERP attendance screenshot and choose to replace, merge or ignore differences.",
      },
      { property: "og:title", content: "Verify Attendance · AttendX" },
      {
        property: "og:description",
        content: "Weekly ERP cross-check for your AttendX attendance records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function VerifyPage() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl">
        <VerifyAttendance onDone={() => navigate({ to: "/" })} />
      </div>
    </AppShell>
  );
}
