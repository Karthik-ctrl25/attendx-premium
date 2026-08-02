import { createFileRoute } from "@tanstack/react-router";

import { AcademicDetailsCard, SubPage } from "@/components/attendx/ProfileView";

export const Route = createFileRoute("/profile/academic")({
  head: () => ({
    meta: [
      { title: "Academic Details — AttendX" },
      {
        name: "description",
        content: "Your USN, email, department, semester, section and join date at CMR University.",
      },
      { property: "og:title", content: "Academic Details — AttendX" },
      {
        property: "og:description",
        content: "Read-only academic record captured during AttendX onboarding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SubPage title="Academic Details" subtitle="Captured at onboarding · read-only">
      <AcademicDetailsCard />
    </SubPage>
  ),
});
