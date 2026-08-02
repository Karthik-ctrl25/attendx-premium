import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { adminAnalytics } from "@/lib/admin.functions";

function Bars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length)
    return <p className="p-2 text-[12px] text-muted-foreground">No data yet.</p>;
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="space-y-1">
          <div className="flex justify-between text-[11.5px]">
            <span className="truncate text-muted-foreground">{d.label}</span>
            <span className="font-semibold tabular-nums">{d.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminAnalyticsPanel() {
  const fetchAnalytics = useServerFn(adminAnalytics);
  const { data } = useQuery({ queryKey: ["admin", "analytics"], queryFn: () => fetchAnalytics({}) });

  const stats = [
    { label: "Total users", value: data?.totalUsers ?? 0 },
    { label: "Daily active", value: data?.dailyActive ?? 0 },
    { label: "Attendance imports", value: data?.imports ?? 0 },
    { label: "OCR success rate", value: `${data?.ocrSuccessRate ?? 0}%` },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stats.map((s) => (
          <GlassCard key={s.label} className="p-3.5">
            <p className="truncate text-[11px] text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{s.value}</p>
          </GlassCard>
        ))}
      </div>
      <div className="grid gap-2.5 lg:grid-cols-2">
        <GlassCard className="p-3.5">
          <SectionTitle title="Students by department" />
          <Bars data={data?.byDepartment ?? []} />
        </GlassCard>
        <GlassCard className="p-3.5">
          <SectionTitle title="Students by semester" />
          <Bars data={data?.bySemester ?? []} />
        </GlassCard>
      </div>
    </div>
  );
}
