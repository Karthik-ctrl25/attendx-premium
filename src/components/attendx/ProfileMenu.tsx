import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Database,
  Download,
  Info,
  Palette,
  Save,
  Upload,
  User,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useApp } from "@/lib/store";
import type { BackupPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

type View =
  | "root"
  | "profile"
  | "export"
  | "backup"
  | "appearance"
  | "about";

const MENU: { view: View; label: string; icon: LucideIcon }[] = [
  { view: "profile", label: "Academic Profile", icon: User },
  { view: "export", label: "Export Data", icon: Download },
  { view: "backup", label: "Backup", icon: Database },
  { view: "appearance", label: "Appearance", icon: Palette },
  { view: "about", label: "About AttendX", icon: Info },
];

const TITLES: Record<View, string> = {
  root: "Profile",
  profile: "Academic Profile",
  export: "Export Data",
  backup: "Backup",
  appearance: "Appearance",
  about: "About AttendX",
};

const field = "h-9 rounded-xl border-white/70 bg-white/70 text-sm shadow-none";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AX";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function download(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
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
      <PanelHeader view={view} onBack={() => setView("root")} onClose={() => setOpen(false)} />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
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
        className="rounded-full p-0.5 ring-1 ring-white/70 shadow-soft transition-transform duration-300 hover:scale-105 active:scale-95"
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
              className="glass-strong absolute right-0 top-[calc(100%+12px)] z-50 w-[380px] origin-top-right overflow-hidden rounded-[26px]"
            >
              {panel}
            </motion.div>
          )
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PanelHeader({
  view,
  onBack,
}: {
  view: View;
  onBack: () => void;
  onClose: () => void;
}) {
  const { meta } = useApp();
  if (view === "root") {
    return (
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <Avatar size={52} className="ring-1 ring-white/70" />
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold tracking-tight">
            {meta.studentName || "Add your name"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[meta.usn, meta.department].filter(Boolean).join(" · ") || meta.university}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[meta.semester && `Sem ${meta.semester}`, meta.section && `Sec ${meta.section}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {meta.email ? (
            <p className="truncate text-xs text-muted-foreground">{meta.email}</p>
          ) : null}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 pb-2 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="grid size-8 place-items-center rounded-full bg-white/70 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Back"
      >
        <ChevronLeft className="size-4" />
      </button>
      <p className="font-display text-sm font-semibold tracking-tight">{TITLES[view]}</p>
    </div>
  );
}

function RootView({ onSelect }: { onSelect: (v: View) => void }) {
  return (
    <div className="flex flex-col gap-1">
      {MENU.map((item) => (
        <button
          key={item.view}
          type="button"
          onClick={() => onSelect(item.view)}
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-foreground/90 transition-colors hover:bg-white/70"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-white/70 shadow-soft">
            <item.icon className="size-4" />
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Panels({ view }: { view: Exclude<View, "root"> }) {
  switch (view) {
    case "profile":
      return <ProfilePanel />;
    case "export":
      return <ExportPanel />;
    case "backup":
      return <BackupPanel />;
    case "appearance":
      return <AppearancePanel />;
    case "about":
      return <AboutPanel />;
  }
}

function ProfilePanel() {
  const { meta, updateMeta } = useApp();
  const [draft, setDraft] = useState(meta);
  const photoRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <div className="space-y-3 px-2 pb-1">
      <div className="flex items-center gap-3">
        {draft.photo ? (
          <img src={draft.photo} alt="Profile" className="size-14 rounded-full object-cover" />
        ) : (
          <span className="grid size-14 place-items-center rounded-full bg-[image:var(--gradient-ink)] text-sm font-semibold text-ink-foreground">
            {initials(draft.studentName)}
          </span>
        )}
        <Button
          variant="secondary"
          className="rounded-2xl"
          onClick={() => photoRef.current?.click()}
        >
          <Upload className="size-4" /> Change photo
        </Button>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => set({ photo: String(reader.result) });
            reader.readAsDataURL(file);
          }}
        />
      </div>

      <Input
        className={field}
        placeholder="Full name"
        value={draft.studentName}
        onChange={(e) => set({ studentName: e.target.value })}
      />
      <Input
        className={field}
        placeholder="USN"
        value={draft.usn ?? ""}
        onChange={(e) => set({ usn: e.target.value.toUpperCase() })}
      />
      <Input
        className={field}
        placeholder="Department"
        value={draft.department ?? ""}
        onChange={(e) => set({ department: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          className={field}
          placeholder="Semester"
          value={draft.semester ?? ""}
          onChange={(e) => set({ semester: e.target.value })}
        />
        <Input
          className={field}
          placeholder="Section"
          value={draft.section ?? ""}
          onChange={(e) => set({ section: e.target.value })}
        />
      </div>
      <Input
        className={field}
        placeholder="Email"
        type="email"
        value={draft.email ?? ""}
        onChange={(e) => set({ email: e.target.value })}
      />
      <Button
        className="w-full rounded-2xl"
        onClick={async () => {
          await updateMeta(draft);
          toast.success("Profile saved");
        }}
      >
        <Save className="size-4" /> Save profile
      </Button>
    </div>
  );
}

function ExportPanel() {
  const { subjects, timetable, history } = useApp();
  const csv = () => {
    const rows = [
      ["Code", "Name", "Faculty", "Present", "Absent", "Total"],
      ...subjects.map((s) => [s.code, s.name, s.faculty, s.present, s.absent, s.total]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendx-attendance-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2 px-2 pb-1">
      <p className="px-1 text-xs text-muted-foreground">
        {subjects.length} subjects · {timetable.length} classes · {history.length} records
      </p>
      <Button
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={() => {
          download(
            { subjects, timetable, history, exportedAt: new Date().toISOString() },
            `attendx-export-${Date.now()}.json`,
          );
          toast.success("Exported as JSON");
        }}
      >
        <Download className="size-4" /> Export JSON
      </Button>
      <Button
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={() => {
          csv();
          toast.success("Exported as CSV");
        }}
      >
        <Download className="size-4" /> Export attendance CSV
      </Button>
    </div>
  );
}

function BackupPanel() {
  const { exportBackup, restoreBackup, resetApp } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2 px-2 pb-1">
      <Button
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={() => {
          download(exportBackup(), `attendx-backup-${Date.now()}.json`);
          toast.success("Backup downloaded");
        }}
      >
        <Download className="size-4" /> Create backup
      </Button>
      <Button
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="size-4" /> Restore from file
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const payload = JSON.parse(await file.text()) as BackupPayload;
            await restoreBackup(payload);
            toast.success("Backup restored");
          } catch {
            toast.error("That file isn't a valid AttendX backup");
          }
        }}
      />
      <Button
        variant="destructive"
        className="w-full rounded-2xl"
        onClick={async () => {
          await resetApp();
          toast("AttendX reset");
        }}
      >
        Reset AttendX
      </Button>
    </div>
  );
}

function AppearancePanel() {
  const { meta, updateMeta } = useApp();
  return (
    <div className="space-y-2 px-2 pb-1">
      <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Reduce motion</p>
          <p className="text-xs text-muted-foreground">Calmer transitions across the app</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!!meta.reduceMotion}
          onClick={() => updateMeta({ reduceMotion: !meta.reduceMotion })}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            meta.reduceMotion ? "bg-ink" : "bg-secondary",
          )}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow-soft",
              meta.reduceMotion ? "left-[22px]" : "left-0.5",
            )}
          />
        </button>
      </div>
      <div className="rounded-2xl bg-white/60 px-4 py-3">
        <p className="text-sm font-medium">Theme</p>
        <p className="text-xs text-muted-foreground">
          Soft Frosted White — a single, light glass theme tuned for readability.
        </p>
      </div>
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
        AttendX turns ERP screenshots into a smart timetable and an offline attendance tracker.
        Everything you add stays on this device — no accounts, no servers, works fully offline.
      </p>
    </div>
  );
}
