import { createFileRoute } from "@tanstack/react-router";

import { ProfileView } from "@/components/attendx/ProfileView";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — AttendX" },
      {
        name: "description",
        content:
          "Your AttendX profile: academic details, class role, semester, theme and daily reminder settings.",
      },
      { property: "og:title", content: "Profile — AttendX" },
      {
        property: "og:description",
        content: "Academic details, class role, semester and reminders — stored on your device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return <ProfileView />;
}
