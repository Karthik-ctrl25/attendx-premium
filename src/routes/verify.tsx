import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// Heavy: pulls the OCR uploader and image preprocessing. Loaded on demand so the
// rest of the student app stays instant.
const VerifyAttendance = lazy(() =>
  import("@/components/attendx/VerifyAttendance").then((m) => ({ default: m.VerifyAttendance })),
);

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
    <div className="mx-auto w-full min-w-0 max-w-2xl pb-2">
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-3xl bg-foreground/[0.05]" aria-hidden />
        }
      >
        <VerifyAttendance onDone={() => navigate({ to: "/" })} />
      </Suspense>
    </div>
  );
}
