import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Placeholder tutorial player.
 * Drop a real file at `public/tutorial.mp4` (or pass `src`) and it plays instead
 * of the animated storyboard — no other change required.
 */
const STEPS = [
  "Open CMR ERP",
  "Open Schedule",
  "Select Week",
  "Take Screenshot",
  "Upload Screenshot",
  "Open Attendance",
  "Take Screenshot",
  "Upload Screenshot",
  "Review extracted data",
  "Finish",
];

export function TutorialVideo({ src, onSkip }: { src?: string; onSkip: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = (fromStart: boolean) => {
    if (src && videoRef.current) {
      if (fromStart) videoRef.current.currentTime = 0;
      void videoRef.current.play();
      setPlaying(true);
      return;
    }
    if (timer.current) clearInterval(timer.current);
    setStep(fromStart ? 0 : step);
    setPlaying(true);
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s >= STEPS.length - 1) {
          if (timer.current) clearInterval(timer.current);
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1100);
  };

  return (
    <div className="space-y-5">
      <div className="glass relative aspect-video w-full overflow-hidden rounded-3xl">
        {src ? (
          <video ref={videoRef} src={src} controls className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-4 bg-[image:var(--gradient-glass)] px-6 text-center">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
                {STEPS[step]}
              </p>
            </motion.div>
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`h-1 rounded-full transition-all ${
                    i <= step ? "w-6 bg-foreground/70" : "w-3 bg-foreground/15"
                  }`}
                />
              ))}
            </div>
            {!playing ? (
              <p className="text-xs text-muted-foreground">Placeholder tutorial · replace anytime</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run(true)} className="rounded-2xl">
          <Play className="size-4" /> Watch Tutorial
        </Button>
        <Button variant="secondary" className="rounded-2xl" onClick={() => run(true)}>
          <RotateCcw className="size-4" /> Replay
        </Button>
        <Button variant="ghost" className="rounded-2xl" onClick={onSkip}>
          <SkipForward className="size-4" /> Skip
        </Button>
      </div>

      <ol className="glass grid gap-2 rounded-3xl p-5 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-sm">
            <span className="tnum grid size-6 shrink-0 place-items-center rounded-full bg-white/80 text-[11px] font-semibold shadow-soft">
              {i + 1}
            </span>
            <span className="text-muted-foreground">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
