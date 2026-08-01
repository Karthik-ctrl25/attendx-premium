import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  Info,
  Moon,
  Palette,
  Pencil,
  Save,
  Sun,
  Upload,
  User,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { DEFAULT_REMINDER_TIME, requestNotificationPermission } from "@/lib/reminders";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type View = "root" | "profile" | "appearance" | "reminders" | "about";

const MENU: { view: View; label: string; icon: LucideIcon }[] = [
  { view: "profile", label: "Academic Profile", icon: User },
  { view: "appearance", label: "Appearance", icon: Palette },
  { view: "reminders", label: "Daily Reminder", icon: Bell },
  { view: "about", label: "About AttendX", icon: Info },
];

const TITLES: Record<View, string> = {
  root: "Profile",
  profile: "Academic Profile",
  appearance: "Appearance",
  reminders: "Daily Reminder",
  about: "About AttendX",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AX";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({ size = 40, className }: { size?: number; className?: string }) {
  const { meta } = useApp();
  return meta.photo ? (
    <img
      src={meta.photo}
      alt={meta.studentName || "Profile photo"}
      style={{ width: size, height: size }}
      className={cn("rounded-full object-cover", className)}
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "grid place-items-center rounded-full bg-[image:var(--gradient-ink)] text-[13px] font-semibold text-ink-foreground",
        className,
      )}
    >
      {initials(meta.studentName)}
    </span>
  );
}

export function ProfileMenu({
  open: openProp,
  onOpenChange,
  hideTrigger,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (next: boolean | ((v: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(open) : next;
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [view, setView] = useState<View>("root");
  const isMobile = useIsMobile();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setView("root");
  }, [open]);

  const panel = (
    <div className="flex max-h-[70dvh] flex-col">
      <PanelHeader view={view} onBack={() => setView("root")} />
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, x: view === "root" ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: view === "root" ? 12 : -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === "root" ? <RootView onSelect={setView} /> : <Panels view={view} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-0.5 shadow-soft ring-1 ring-white/70 transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        <Avatar size={36} />
      </button>

      <AnimatePresence>
        {open ? (
          isMobile ? (
            <>
              <motion.div
                key="scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px]"
              />
              <motion.div
                key="sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                className="glass-strong fixed inset-x-2 bottom-2 z-50 overflow-hidden rounded-[28px]"
              >
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/15" />
                {panel}
              </motion.div>
            </>
          ) : (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute right-0 top-[calc(100%+12px)] z-50 w-[380px] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-[26px]"
            >
              {panel}
            </motion.div>
          )
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PanelHeader({ view, onBack }: { view: View; onBack: () => void }) {
  const { meta } = useApp();
  if (view === "root") {
    return (
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <Avatar size={52} className="shrink-0 ring-1 ring-white/70" />
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold tracking-tight">
            {meta.studentName || "Add your name"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[meta.usn, meta.department].filter(Boolean).join(" · ") || meta.university}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 pb-2 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="grid size-8 shrink-0 place-items-center rounded-full bg-white/70 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Back"
      >
        <ChevronLeft className="size-4" />
      </button>
      <p className="font-display text-sm font-semibold tracking-tight">{TITLES[view]}</p>
    </div>
  );
}

function RootView({ onSelect }: { onSelect: (v: View) => void }) {
  const { resetApp } = useApp();
  return (
    <div className="flex flex-col gap-1">
      {MENU.map((item) => (
        <button
          key={item.view}
          type="button"
          onClick={() => onSelect(item.view)}
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-foreground/90 transition-colors hover:bg-white/70"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
            <item.icon className="size-4" />
          </span>
          {item.label}
        </button>
      ))}
      <button
        type="button"
        onClick={async () => {
          await resetApp();
          toast("AttendX reset");
        }}
        className="mt-1 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-bad transition-colors hover:bg-white/70"
      >
        Reset AttendX
      </button>
    </div>
  );
}

function Panels({ view }: { view: Exclude<View, "root"> }) {
  switch (view) {
    case "profile":
      return <ProfilePanel />;
    case "appearance":
      return <AppearancePanel />;
    case "reminders":
      return <RemindersPanel />;
    case "about":
      return <AboutPanel />;
  }
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3">
      <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

/** Academic details are read-only. Only the photo and name can be edited. */
function ProfilePanel() {
  const { meta, updateMeta } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(meta.studentName);
  const photoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2 px-2 pb-1">
      <div className="flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-3">
        <Avatar size={56} className="shrink-0 ring-1 ring-white/70" />
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              className="h-9 rounded-xl border-white/70 bg-white/80 text-sm shadow-none"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : (
            <>
              <p className="truncate font-display text-[15px] font-semibold tracking-tight">
                {meta.studentName || "Add your name"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{meta.university}</p>
            </>
          )}
        </div>
        {editing ? (
          <Button
            size="sm"
            className="shrink-0 rounded-xl"
            onClick={() => photoRef.current?.click()}
            variant="secondary"
          >
            <Upload className="size-4" />
          </Button>
        ) : null}
      </div>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => void updateMeta({ photo: String(reader.result) });
          reader.readAsDataURL(file);
        }}
      />

      <Row label="USN" value={meta.usn} />
      <Row label="Email" value={meta.email} />
      <Row label="Department" value={meta.department} />
      <Row label="Semester" value={meta.semester} />
      <Row label="Section" value={meta.section} />

      {editing ? (
        <Button
          className="w-full rounded-2xl"
          onClick={async () => {
            await updateMeta({ studentName: name.trim() });
            setEditing(false);
            toast.success("Profile updated");
          }}
        >
          <Save className="size-4" /> Save
        </Button>
      ) : (
        <Button variant="secondary" className="w-full rounded-2xl" onClick={() => setEditing(true)}>
          <Pencil className="size-4" /> Edit photo & name
        </Button>
      )}
      <p className="px-1 pt-1 text-[11px] leading-relaxed text-muted-foreground">
        Academic details come from your setup and stay fixed to keep your records consistent.
      </p>
    </div>
  );
}

function AppearancePanel() {
  const { meta, updateMeta } = useApp();
  const theme = meta.theme === "dark" ? "dark" : "light";
  const options = [
    { key: "light" as const, label: "Light", icon: Sun },
    { key: "dark" as const, label: "Dark", icon: Moon },
  ];
  return (
    <div className="space-y-2 px-2 pb-1">
      <p className="px-1 text-xs text-muted-foreground">Theme</p>
      <div className="grid grid-cols-2 gap-2">
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
          </button>
        ))}
      </div>
    </div>
  );
}

function RemindersPanel() {
  const { meta, updateMeta } = useApp();
  const enabled = meta.reminderEnabled !== false;
  return (
    <div className="space-y-2 px-2 pb-1">
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
    </div>
  );
}

function AboutPanel() {
  const { meta } = useApp();
  return (
    <div className="space-y-2 px-2 pb-1 text-sm">
      <div className="rounded-2xl bg-white/60 px-4 py-3">
        <p className="font-display text-base font-semibold tracking-tight">AttendX</p>
        <p className="text-xs text-muted-foreground">Version 1.0 · {meta.university}</p>
      </div>
      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        A private, offline attendance tracker for CMR University students.
      </p>
    </div>
  );
}
