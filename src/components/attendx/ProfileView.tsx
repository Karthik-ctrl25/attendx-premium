import { motion } from "framer-motion";
import {
  BadgeCheck,
  Info,
  Moon,
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
import { useClassSpace } from "@/lib/class-store";
import { DEFAULT_REMINDER_TIME, requestNotificationPermission } from "@/lib/reminders";
import { ROLE_LABEL, can, type Role } from "@/lib/roles";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3">
      <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function ProfileView() {
  const { meta } = useApp();
  const role: Role = meta.role ?? "student";

  return (
    <div className="w-full min-w-0 space-y-5 pb-2">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.university}</p>
      </header>

      <IdentityCard />

      <SemesterCard />

      <section>
        <SectionTitle title="Class role" subtitle={ROLE_LABEL[role]} />
        <CrCard />
      </section>

      {can(role, "cr.approve") ? <AdminConsole /> : null}

      <section>
        <SectionTitle title="Appearance" />
        <ThemeCard />
      </section>

      <section>
        <SectionTitle title="Notifications" />
        <RemindersCard />
      </section>

      <section>
        <SectionTitle title="About AttendX" />
        <GlassCard className="flex min-w-0 items-center gap-3 p-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
            <Info className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">AttendX · Version 1.0</p>
            <p className="truncate text-xs text-muted-foreground">
              Private, offline attendance for CMR University.
            </p>
          </div>
        </GlassCard>
      </section>

      <section className="pb-2">
        <SectionTitle title="Danger zone" subtitle="Irreversible, this device only" />
        <DangerZone />
      </section>
    </div>
  );
}

/** Profile is captured during onboarding and is read-only afterwards. */
function IdentityCard() {
  const { meta } = useApp();
  const role: Role = meta.role ?? "student";
  const joined = meta.createdAt
    ? new Date(meta.createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <GlassCard strong className="space-y-2 p-5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size={56} className="shrink-0 ring-1 ring-white/70" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[17px] font-semibold tracking-tight">
            {meta.studentName || "Student"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{meta.usn || "USN not set"}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Row label="USN" value={meta.usn} />
        <Row label="Email" value={meta.email} />
        <Row label="Department" value={meta.department} />
        <Row label="Semester" value={meta.semester} />
        <Row label="Section" value={meta.section} />
        <Row label="Role" value={ROLE_LABEL[role]} />
        <Row label="Joined" value={joined} />
      </div>

      <p className="px-1 pt-1 text-[11px] leading-relaxed text-muted-foreground">
        Your profile is set during onboarding and stays fixed so attendance records remain
        consistent.
      </p>
    </GlassCard>
  );
}

function CrCard() {
  const { meta } = useApp();
  const { applyForCr } = useClassSpace();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const role: Role = meta.role ?? "student";
  const status = meta.crRequestStatus ?? "none";

  if (role !== "student") {
    return (
      <GlassCard className="flex min-w-0 items-center gap-3 p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <BadgeCheck className="size-4 text-good" />
        </span>
        <p className="min-w-0 truncate text-sm font-semibold">You are a {ROLE_LABEL[role]}</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="space-y-3 p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <ShieldQuestion className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Class Representative</p>
          <p className="truncate text-xs text-muted-foreground">
            {status === "pending"
              ? "Application submitted · pending approval"
              : status === "rejected"
                ? "Your last application was not approved"
                : "Apply and an admin will review your request"}
          </p>
        </div>
      </div>

      {status === "pending" ? null : open ? (
        <div className="space-y-2">
          <Textarea
            rows={3}
            placeholder="Why should you be the CR?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-2xl border-white/70 bg-white/80"
          />
          <Button
            className="w-full rounded-2xl"
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
      ) : (
        <Button variant="secondary" className="w-full rounded-2xl" onClick={() => setOpen(true)}>
          Apply as Class Representative
        </Button>
      )}
    </GlassCard>
  );
}

function AdminConsole() {
  const { crRequests, reviewCrRequest } = useClassSpace();
  const pending = crRequests.filter((r) => r.status === "pending");
  return (
    <section>
      <SectionTitle title="Admin · CR requests" subtitle={`${pending.length} pending`} />
      {pending.length ? (
        <GlassCard className="divide-y divide-foreground/5 p-2">
          {pending.map((r) => (
            <div key={r.id} className="min-w-0 space-y-2 px-3 py-3">
              <p className="truncate text-sm font-semibold">
                {r.name || "Student"} · {r.usn || "USN"}
              </p>
              <p className="text-xs text-muted-foreground">{r.reason}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={() => void reviewCrRequest(r.id, true)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => void reviewCrRequest(r.id, false)}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </GlassCard>
      ) : (
        <GlassCard className="p-6 text-center text-sm text-muted-foreground">
          No pending requests.
        </GlassCard>
      )}
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
    <GlassCard className="grid grid-cols-2 gap-2 p-3">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => updateMeta({ theme: o.key })}
          className={cn(
            "flex flex-col items-center gap-2 rounded-2xl px-4 py-4 text-sm font-medium transition-colors",
            theme === o.key
              ? "bg-ink text-ink-foreground shadow-soft"
              : "bg-white/60 text-foreground hover:bg-white/80",
          )}
        >
          <o.icon className="size-5" />
          {o.label}
          {o.key === "light" ? (
            <span className="text-[10px] font-normal opacity-70">Default</span>
          ) : null}
        </button>
      ))}
    </GlassCard>
  );
}

function RemindersCard() {
  const { meta, updateMeta } = useApp();
  const enabled = meta.reminderEnabled !== false;
  return (
    <GlassCard className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Daily reminder</p>
          <p className="text-xs text-muted-foreground">
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
        <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3">
          <span className="text-sm font-medium">Reminder time</span>
          <input
            type="time"
            value={meta.reminderTime || DEFAULT_REMINDER_TIME}
            onChange={(e) => updateMeta({ reminderTime: e.target.value || DEFAULT_REMINDER_TIME })}
            className="tnum shrink-0 rounded-xl bg-white/80 px-3 py-1.5 text-sm shadow-soft outline-none"
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
        className="glass glass-hover flex w-full min-w-0 items-center gap-3 rounded-3xl px-5 py-4 text-left"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <TriangleAlert className="size-4 text-bad" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-bad">Reset all data</span>
          <span className="block truncate text-xs text-muted-foreground">
            Remove everything stored on this device
          </span>
        </span>
      </button>
    );
  }

  return (
    <GlassCard className="space-y-3 p-5 ring-1 ring-bad/30">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
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
