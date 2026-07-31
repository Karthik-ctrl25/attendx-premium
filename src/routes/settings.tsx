import { createFileRoute } from "@tanstack/react-router";
import { Download, Lock, Plus, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { SubjectsEditor, TimetableEditor } from "@/components/attendx/Editors";
import { GlassCard, SectionTitle } from "@/components/attendx/GlassCard";
import { FUTURE_MODULES } from "@/components/attendx/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/lib/store";
import type { BackupPayload, Subject } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AttendX" },
      {
        name: "description",
        content: "Edit subjects and timetable, back up or restore your data, or reset AttendX.",
      },
      { property: "og:title", content: "Settings — AttendX" },
      { property: "og:description", content: "Full control over your offline AttendX data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const {
    subjects,
    timetable,
    saveSubjects,
    saveTimetable,
    exportBackup,
    restoreBackup,
    resetApp,
    meta,
  } = useApp();
  const [draftSubjects, setDraftSubjects] = useState<Subject[]>(subjects);
  const [draftSlots, setDraftSlots] = useState(timetable);
  const [newCode, setNewCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const download = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {meta.university} · all data stays on this device
        </p>
      </header>

      <Tabs defaultValue="subjects">
        <TabsList className="glass rounded-2xl p-1">
          <TabsTrigger value="subjects" className="rounded-xl">
            Subjects
          </TabsTrigger>
          <TabsTrigger value="timetable" className="rounded-xl">
            Timetable
          </TabsTrigger>
          <TabsTrigger value="data" className="rounded-xl">
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-5 space-y-4">
          <SubjectsEditor subjects={draftSubjects} onChange={setDraftSubjects} />
          <div className="flex flex-wrap gap-2">
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="New course code"
              className="h-10 max-w-52 rounded-2xl border-white/70 bg-white/70"
            />
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => {
                const code = newCode.trim();
                if (!code || draftSubjects.some((s) => s.code === code)) return;
                setDraftSubjects([
                  ...draftSubjects,
                  { code, name: code, faculty: "", present: 0, absent: 0, total: 0 },
                ]);
                setNewCode("");
              }}
            >
              <Plus className="size-4" /> Add subject
            </Button>
            <Button
              className="rounded-2xl"
              onClick={async () => {
                await saveSubjects(draftSubjects);
                toast.success("Subjects saved");
              }}
            >
              Save subjects
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="timetable" className="mt-5 space-y-4">
          <TimetableEditor slots={draftSlots} onChange={setDraftSlots} />
          <Button
            className="rounded-2xl"
            onClick={async () => {
              await saveTimetable(draftSlots);
              toast.success("Timetable saved");
            }}
          >
            Save timetable
          </Button>
        </TabsContent>

        <TabsContent value="data" className="mt-5 space-y-4">
          <GlassCard className="grid gap-3 p-6 sm:grid-cols-3">
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => {
                download(exportBackup(), `attendx-backup-${Date.now()}.json`);
                toast.success("Backup downloaded");
              }}
            >
              <Download className="size-4" /> Backup JSON
            </Button>
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" /> Restore JSON
            </Button>
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => {
                download(
                  { subjects, timetable, exportedAt: new Date().toISOString() },
                  `attendx-export-${Date.now()}.json`,
                );
                toast.success("Data exported");
              }}
            >
              <Download className="size-4" /> Export data
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
                  setDraftSubjects(payload.subjects ?? []);
                  setDraftSlots(payload.timetable ?? []);
                  toast.success("Backup restored");
                } catch {
                  toast.error("That file isn't a valid AttendX backup");
                }
              }}
            />
          </GlassCard>

          <GlassCard className="p-6">
            <SectionTitle title="Reset app" subtitle="Deletes everything and restarts setup" />
            <Button
              variant="destructive"
              className="rounded-2xl"
              onClick={async () => {
                await resetApp();
                toast("AttendX reset");
              }}
            >
              <RotateCcw className="size-4" /> Reset AttendX
            </Button>
          </GlassCard>
        </TabsContent>
      </Tabs>

      <section>
        <SectionTitle title="Coming later" subtitle="Reserved space for future modules" />
        <div className="grid gap-3 sm:grid-cols-3">
          {FUTURE_MODULES.map((m) => (
            <GlassCard key={m} className="flex items-center gap-3 p-5 opacity-70">
              <Lock className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{m}</span>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}
