import { createFileRoute } from "@tanstack/react-router";

import { ProfileView } from "@/components/attendx/ProfileView";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [
      { title: "Profile — AttendX" },
      {
        name: "description",
        content: "Your AttendX profile: photo, name, USN, class and app settings.",
      },
      { property: "og:title", content: "Profile — AttendX" },
      {
        property: "og:description",
        content: "Photo, name, USN and class details with quick access to app settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ProfileView />,
});
