import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  Info,
  LogOut,
  Moon,
  ShieldCheck,
  ShieldQuestion,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/attendx/Avatar";
import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { SemesterCard } from "@/components/attendx/SemesterCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/auth.functions";
import { useClassSpace } from "@/lib/class-store";
import { DEFAULT_REMINDER_TIME, requestNotificationPermission } from "@/lib/reminders";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-[7px]">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-[12.5px] font-medium">{value || "—"}</span>
    </div>
  );
}

export function ProfileView() {
  const { meta } = useApp();

  return (
    <div className="mx-auto w-full min-w-0 max-w-[700px] space-y-3 pb-2">
      <header>
        <h1 className="font-display text-xl font-semibold tracking-tight">Profile</h1>
        <p className="text-[11px] text-muted-foreground">{meta.university}</p>
      </header>

      <IdentityCard />

      <section>
        <SectionTitle title="Academic information" />
        <AcademicDetailsCard />
      </section>

      <SemesterCard />

      <AccountCard />


      <section>
        <SectionTitle title="Preferences" />
        <ThemeCard />
      </section>

      <section>
        <SectionTitle title="Notifications" />
        <RemindersCard />
      </section>

      <section>
        <SectionTitle title="About" />
        <GlassCard className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
            <Info className="size-3.5 text-muted-foreground" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">AttendX · Version 1.0</p>
            <p className="truncate text-[11px] text-muted-foreground">
              Private, offline attendance for CMR University.
            </p>
          </div>
        </GlassCard>
      </section>

      <section className="pb-2">
        <SectionTitle title="Danger zone" />
        <DangerZone />
      </section>
    </div>
  );
}

/** Profile is captured during onboarding and is read-only afterwards. */
function IdentityCard() {
  const { meta } = useApp();
  const role: Role = meta.role ?? "student";

  return (
    <GlassCard strong className="px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <Avatar size={44} className="shrink-0 ring-1 ring-white/70" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold leading-tight tracking-tight">
            {meta.studentName || "Student"}
          </p>
          <p className="truncate text-[11.5px] text-muted-foreground">
            {meta.department || "Dept"} • Semester {meta.semester || "—"} • Section{" "}
            {meta.section || "—"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-primary shadow-soft">
          {ROLE_LABEL[role]}
        </span>
      </div>
      {role === "student" ? (
        <div className="mt-2 border-t border-foreground/5 pt-2">
          <CrCard />
        </div>
      ) : null}
    </GlassCard>
  );
}

function AcademicDetailsCard() {
  const { meta } = useApp();
  const joined = meta.createdAt
    ? new Date(meta.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
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
    <GlassCard className="px-3 py-1">
      <div className="divide-y divide-foreground/5">
        {rows.map((r) => (
          <InfoRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </GlassCard>
  );
}

/** Inline CR row rendered inside the identity card. */
function CrCard() {
  const { meta } = useApp();
  const { applyForCr } = useClassSpace();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const status = meta.crRequestStatus ?? "none";

  return (
    <div className="space-y-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <ShieldQuestion className="size-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium">Class Representative</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {status === "pending"
              ? "Application submitted · pending approval"
              : status === "rejected"
                ? "Your last application was not approved"
                : "Apply and an admin will review your request"}
          </p>
        </div>
        {status === "pending" || open ? null : (
          <Button
            size="sm"
            variant="secondary"
            className="h-7 shrink-0 rounded-xl px-2.5 text-[11.5px]"
            onClick={() => setOpen(true)}
          >
            Apply
          </Button>
        )}
      </div>

      {status !== "pending" && open ? (
        <div className="space-y-2">
          <Textarea
            rows={2}
            placeholder="Why should you be the CR?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl border-white/70 bg-white/80 text-[12.5px]"
          />
          <Button
            size="sm"
            className="w-full rounded-xl"
            disabled={reason.trim().length < 5}
            onClick={async () => {
              await applyForCr(reason);
              setOpen(false);
              setReason("");
              toast.success("Application submitted — pending approval");
            }}
          >
            Submit application
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Session & role. The role shown here is resolved on the server from the
 * roles table — the client never grants itself admin access.
 */
function AccountCard() {
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
    <section>
      <SectionTitle title="Account" subtitle={ROLE_LABEL[serverRole]} />
      <GlassCard className="divide-y divide-foreground/5 px-3 py-1">
        {serverRole === "admin" ? (
          <Link
            to="/admin"
            className="flex min-w-0 items-center gap-2.5 py-2.5 text-left"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
              <ShieldCheck className="size-3.5 text-good" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">Admin console</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                Review CR requests
              </span>
            </span>
          </Link>
        ) : null}
        <button
          type="button"
          onClick={signOut}
          className="flex w-full min-w-0 items-center gap-2.5 py-2.5 text-left"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
            <LogOut className="size-3.5 text-muted-foreground" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold">Sign out</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              You will stay signed in on this device until you sign out
            </span>
          </span>
        </button>
      </GlassCard>
    </section>
  );
}


function ThemeCard() {
  const { meta, updateMeta } = useApp();
  const theme = meta.theme === "dark" ? "dark" : "light";
  const options = [
    { key: "light" as const, label: "Light", icon: Sun },
    { key: "dark" as const, label: "Dark", icon: Moon },
  ];
  return (
    <GlassCard className="grid grid-cols-2 gap-1.5 p-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => updateMeta({ theme: o.key })}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-[13px] font-medium transition-colors",
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

function RemindersCard() {
  const { meta, updateMeta } = useApp();
  const enabled = meta.reminderEnabled !== false;
  return (
    <GlassCard className="divide-y divide-foreground/5 px-3 py-1">
      <div className="flex items-center justify-between gap-3 py-2">
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
        <label className="flex items-center justify-between gap-3 py-2">
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

/** The only place data can be destroyed — collapsed, and typed-confirmation gated. */
function DangerZone() {
  const { resetApp } = useApp();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass glass-hover flex w-full min-w-0 items-center gap-2.5 rounded-3xl px-3 py-2.5 text-left"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
          <TriangleAlert className="size-3.5 text-bad" />
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
