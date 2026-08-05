import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";

import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/auth.functions";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const fetchRole = useServerFn(getMyRole);
  const { data } = useQuery({ queryKey: ["my-role"], queryFn: () => fetchRole({}) });
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const rows: [string, string][] = [
    ["Email", session?.user?.email ?? "—"],
    ["User ID", data?.userId ?? "—"],
    ["Role", data?.role ?? "—"],
  ];

  return (
    <section className="space-y-3.5">
      <h1 className="font-display text-xl font-semibold tracking-tight">Settings</h1>

      <GlassCard className="space-y-2 p-3.5">
        <SectionTitle title="Signed in as" />
        <dl className="text-[12.5px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-1">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="min-w-0 truncate font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0 text-good" />
          Admin access is verified on the server for every action.
        </p>
      </GlassCard>

      <GlassCard className="flex flex-wrap items-center justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">Student app</p>
          <p className="text-[11.5px] text-muted-foreground">Open AttendX as a student.</p>
        </div>
        <Button asChild size="sm" variant="secondary" className="rounded-xl">
          <Link to="/">
            <ExternalLink className="mr-1 size-3.5" /> Open
          </Link>
        </Button>
      </GlassCard>

      <GlassCard className="flex flex-wrap items-center justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">Sign out</p>
          <p className="text-[11.5px] text-muted-foreground">End this admin session.</p>
        </div>
        <Button size="sm" variant="ghost" className="rounded-xl text-bad" onClick={signOut}>
          <LogOut className="mr-1 size-3.5" /> Logout
        </Button>
      </GlassCard>
    </section>
  );
}
