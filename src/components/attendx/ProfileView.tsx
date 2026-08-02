import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Info,
  LogOut,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/attendx/Avatar";
import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/auth.functions";
import { IMPORTANT_LINKS } from "@/lib/class-store";
import { DEFAULT_REMINDER_TIME, requestNotificationPermission } from "@/lib/reminders";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

export function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-[9px]">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-[12.5px] font-medium">{value || "—"}</span>
    </div>
  );
}

export function SubPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[700px] space-y-4 pb-4">
      <header className="space-y-1">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-[12px] text-muted-foreground"
        >
          <ChevronRight className="size-3.5 rotate-180" /> Profile
        </Link>
        <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-[11.5px] text-muted-foreground">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  hint,
  to,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const body = (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
        <Icon className={cn("size-4", danger ? "text-bad" : "text-muted-foreground")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-[13.5px] font-medium", danger && "text-bad")}>
          {label}
        </span>
      </span>
      {hint ? (
        <span className="shrink-0 truncate text-[11.5px] text-muted-foreground">{hint}</span>
      ) : null}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" />
    </>
  );

  const className = "flex w-full min-w-0 items-center gap-3 py-3 text-left";
  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Profile dashboard                                                   */
/* ------------------------------------------------------------------ */

export function ProfileView() {
  const fetchRole = useServerFn(getMyRole);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["my-role"], queryFn: () => fetchRole({}) });
  const serverRole: Role = data?.role ?? "student";

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[700px] space-y-4 pb-4">
      <IdentityCard />

      <GlassCard className="divide-y divide-foreground/5 px-3.5 py-0.5">
        <MenuRow icon={GraduationCap} label="Academic Details" to="/profile/academic" />
        <MenuRow icon={Bell} label="Notifications" to="/profile/notifications" />
        <MenuRow icon={Palette} label="Appearance" to="/profile/appearance" />
        <MenuRow icon={ExternalLink} label="Useful Links" to="/profile/links" />
        <MenuRow icon={Info} label="About AttendX" to="/profile/about" />
        {serverRole === "admin" ? (
          <MenuRow icon={ShieldCheck} label="Admin console" to="/admin" />
        ) : null}
        <MenuRow icon={LogOut} label="Sign Out" danger onClick={signOut} />
      </GlassCard>
    </div>
  );
}

function IdentityCard() {
  const { meta } = useApp();
  const role: Role = meta.role ?? "student";

  return (
    <GlassCard strong className="px-4 py-4">
      <div className="flex items-center gap-3.5">
        <Avatar size={56} className="shrink-0 ring-1 ring-white/70" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[17px] font-semibold leading-tight tracking-tight">
            {meta.studentName || "Student"}
          </p>
          <p className="tnum truncate text-[12px] text-muted-foreground">{meta.usn || "—"}</p>
          <p className="truncate text-[11.5px] text-muted-foreground">
            {meta.department || "Dept"} • Semester {meta.semester || "—"} • Section{" "}
            {meta.section || "—"}
          </p>
        </div>
        <span className="shrink-0 self-start rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-soft">
          {ROLE_LABEL[role]}
        </span>
      </div>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-page sections                                                   */
/* ------------------------------------------------------------------ */

export function AcademicDetailsCard() {
  const { meta } = useApp();
  const joined = meta.createdAt
    ? new Date(meta.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "—";

  const rows = [
    { label: "USN", value: meta.usn },
    { label: "Email", value: meta.email },
    { label: "Department", value: meta.department },
    { label: "Semester", value: meta.semester },
    { label: "Section", value: meta.section },
    { label: "Joined", value: joined },
  ];

  return (
    <GlassCard className="px-3.5 py-1">
      <div className="divide-y divide-foreground/5">
        {rows.map((r) => (
          <InfoRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </GlassCard>
  );
}

export function ThemeCard() {
  const { meta, updateMeta } = useApp();
  const theme = meta.theme === "light" ? "light" : "dark";
  const options = [
    { key: "dark" as const, label: "Dark Slate", icon: Moon },
    { key: "light" as const, label: "Soft White", icon: Sun },
  ];
  return (
    <GlassCard className="grid grid-cols-2 gap-1.5 p-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => updateMeta({ theme: o.key })}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-colors",
            theme === o.key
              ? "bg-ink text-ink-foreground shadow-soft"
              : "bg-white/60 text-foreground hover:bg-white/80",
          )}
        >
          <o.icon className="size-4" />
          {o.label}
        </button>
      ))}
    </GlassCard>
  );
}

export function RemindersCard() {
  const { meta, updateMeta } = useApp();
  const enabled = meta.reminderEnabled !== false;
  return (
    <GlassCard className="divide-y divide-foreground/5 px-3.5 py-1">
      <div className="flex items-center justify-between gap-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium">Daily reminder</p>
          <p className="text-[11px] text-muted-foreground">
            “Did you attend today’s classes?” every evening
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={async () => {
            const next = !enabled;
            if (next) await requestNotificationPermission();
            await updateMeta({ reminderEnabled: next });
          }}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            enabled ? "bg-ink" : "bg-secondary",
          )}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow-soft",
              enabled ? "left-[22px]" : "left-0.5",
            )}
          />
        </button>
      </div>
      {enabled ? (
        <label className="flex items-center justify-between gap-3 py-2.5">
          <span className="text-[12.5px] font-medium">Reminder time</span>
          <input
            type="time"
            value={meta.reminderTime || DEFAULT_REMINDER_TIME}
            onChange={(e) => updateMeta({ reminderTime: e.target.value || DEFAULT_REMINDER_TIME })}
            className="tnum shrink-0 rounded-xl bg-white/80 px-2.5 py-1 text-[12.5px] shadow-soft outline-none"
          />
        </label>
      ) : null}
    </GlassCard>
  );
}

export function UsefulLinksCard() {
  return (
    <GlassCard className="divide-y divide-foreground/5 px-3.5 py-0.5">
      {IMPORTANT_LINKS.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          className="flex w-full min-w-0 items-center gap-3 py-3"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{l.label}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" />
        </a>
      ))}
    </GlassCard>
  );
}

export function AboutCard() {
  return (
    <GlassCard className="flex min-w-0 items-center gap-3 px-3.5 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
        <Info className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold">AttendX · Version 1.0</p>
        <p className="truncate text-[11px] text-muted-foreground">
          Smart attendance & timetable for CMR University.
        </p>
      </div>
    </GlassCard>
  );
}

/** The only place data can be destroyed — typed-confirmation gated. */
export function DangerZone() {
  const { resetApp } = useApp();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass glass-hover flex w-full min-w-0 items-center gap-3 rounded-3xl px-3.5 py-3 text-left"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
          <TriangleAlert className="size-4 text-bad" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-bad">Reset all data</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            Remove everything stored on this device
          </span>
        </span>
      </button>
    );
  }

  return (
    <GlassCard className="space-y-2.5 p-3.5 ring-1 ring-bad/30">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <TriangleAlert className="size-4 text-bad" />
        </span>
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          This will permanently remove all attendance, timetable and profile data stored on this
          device.
        </p>
      </div>
      <Input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value.toUpperCase())}
        placeholder="Type RESET to confirm"
        aria-label="Type RESET to confirm"
        className="rounded-2xl border-white/70 bg-white/80"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="destructive"
          className="rounded-2xl"
          disabled={confirm !== "RESET" || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await resetApp();
              toast("All data removed");
            } finally {
              setBusy(false);
            }
          }}
        >
          Reset all data
        </Button>
        <Button
          variant="secondary"
          className="rounded-2xl"
          onClick={() => {
            setOpen(false);
            setConfirm("");
          }}
        >
          Cancel
        </Button>
      </div>
    </GlassCard>
  );
}

export { SectionTitle };
