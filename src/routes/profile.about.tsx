import { createFileRoute } from "@tanstack/react-router";

import { AboutCard, DangerZone, SectionTitle, SubPage } from "@/components/attendx/ProfileView";

export const Route = createFileRoute("/profile/about")({
  head: () => ({
    meta: [
      { title: "About AttendX" },
      {
        name: "description",
        content:
          "AttendX version information and the option to remove all data stored on this device.",
      },
      { property: "og:title", content: "About AttendX" },
      { property: "og:description", content: "Version details and device data controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SubPage title="About AttendX">
      <AboutCard />
      <section>
        <SectionTitle title="Danger zone" />
        <DangerZone />
      </section>
    </SubPage>
  ),
});
