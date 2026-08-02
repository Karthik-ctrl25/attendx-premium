import { createFileRoute } from "@tanstack/react-router";

import { RemindersCard, SubPage } from "@/components/attendx/ProfileView";

export const Route = createFileRoute("/profile/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Settings — AttendX" },
      {
        name: "description",
        content: "Control the daily attendance reminder and the time it arrives each evening.",
      },
      { property: "og:title", content: "Notification Settings — AttendX" },
      {
        property: "og:description",
        content: "Daily attendance reminders, on your schedule.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SubPage title="Notifications" subtitle="Daily reminders and timing">
      <RemindersCard />
    </SubPage>
  ),
});
