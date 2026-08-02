import { createFileRoute } from "@tanstack/react-router";

import { SubPage, ThemeCard } from "@/components/attendx/ProfileView";

export const Route = createFileRoute("/profile/appearance")({
  head: () => ({
    meta: [
      { title: "Appearance — AttendX" },
      {
        name: "description",
        content: "Switch AttendX between the Dark Slate and Soft White frosted glass themes.",
      },
      { property: "og:title", content: "Appearance — AttendX" },
      { property: "og:description", content: "Dark Slate or Soft White — your choice sticks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SubPage title="Appearance" subtitle="Dark Slate is the default theme">
      <ThemeCard />
    </SubPage>
  ),
});
