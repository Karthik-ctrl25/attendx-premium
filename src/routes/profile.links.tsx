import { createFileRoute } from "@tanstack/react-router";

import { SubPage, UsefulLinksCard } from "@/components/attendx/ProfileView";

export const Route = createFileRoute("/profile/links")({
  head: () => ({
    meta: [
      { title: "Useful Links — AttendX" },
      {
        name: "description",
        content: "Quick access to the CMR University ERP login and department website.",
      },
      { property: "og:title", content: "Useful Links — AttendX" },
      { property: "og:description", content: "CMR ERP login and department website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SubPage title="Useful Links" subtitle="Opens in your browser">
      <UsefulLinksCard />
    </SubPage>
  ),
});
