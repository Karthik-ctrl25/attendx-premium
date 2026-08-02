import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  Building2,
  CalendarRange,
  Layers,
  Megaphone,
  BarChart3,
  UploadCloud,
  ShieldQuestion,
} from "lucide-react";

import { GlassCard } from "@/components/attendx/GlassCard";
import { adminOverview } from "@/lib/admin.functions";

export function AdminOverviewCards() {
  const fetchOverview = useServerFn(adminOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview({}),
  });

  const items = [
    { label: "Total students", value: data?.students, icon: Users },
    { label: "Departments", value: data?.departments, icon: Building2 },
    { label: "Semesters", value: data?.semesters, icon: CalendarRange },
    { label: "Sections", value: data?.sections, icon: Layers },
    { label: "Announcements", value: data?.announcements, icon: Megaphone },
    { label: "Polls", value: data?.polls, icon: BarChart3 },
    { label: "Attendance imports", value: data?.imports, icon: UploadCloud },
    { label: "Pending CR requests", value: data?.pendingCr, icon: ShieldQuestion },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <GlassCard key={item.label} delay={i * 0.02} className="p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <item.icon className="size-3.5" />
            <span className="truncate text-[11px]">{item.label}</span>
          </div>
          <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums">
            {isLoading ? "—" : (item.value ?? 0)}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
