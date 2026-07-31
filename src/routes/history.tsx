import { createFileRoute } from "@tanstack/react-router";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — AttendX" },
      {
        name: "description",
        content: "Every attendance action with date, subject and timestamp, with one-tap undo.",
      },
      { property: "og:title", content: "History — AttendX" },
      { property: "og:description", content: "A complete, undoable log of your attendance marks." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { history, undo } = useApp();

  const groups = history.reduce<Record<string, typeof history>>((acc, h) => {
    const key = new Date(h.ts).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    (acc[key] ||= []).push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">{history.length} recorded actions</p>
      </header>

      {Object.keys(groups).length ? (
        Object.entries(groups).map(([day, entries], gi) => (
          <section key={day}>
            <h2 className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {day}
            </h2>
            <GlassCard delay={gi * 0.04} className="divide-y divide-white/60 p-2">
              {entries.map((h) => (
                <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`size-2 rounded-full ${h.action === "present" ? "bg-good" : "bg-bad"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{h.name}</p>
                    <p className="tnum text-xs text-muted-foreground">
                      {h.code} ·{" "}
                      {new Date(h.ts).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold capitalize ${
                      h.action === "present" ? "text-good" : "text-bad"
                    }`}
                  >
                    {h.action}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-muted-foreground"
                    onClick={async () => {
                      await undo(h.id);
                      toast("Action undone");
                    }}
                  >
                    <Undo2 className="size-4" />
                  </Button>
                </div>
              ))}
            </GlassCard>
          </section>
        ))
      ) : (
        <GlassCard className="p-10 text-center">
          <p className="font-display text-lg font-semibold">Nothing here yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Mark a class present or absent to start your log.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
