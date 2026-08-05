import { motion } from "framer-motion";
import { Play, RotateCcw, SkipForward } from "lucide-react";
import { useState } from "react";

/**
 * Tutorial player.
 * Drop the tutorial file at /public/tutorial.mp4 — it is served at "/tutorial.mp4".
 * Optional poster image: /public/tutorial-poster.jpg
 */
const VIDEO_SRC = "/tutorial.mp4";

export function TutorialVideo({ onSkip }: { onSkip?: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [nonce, setNonce] = useState(0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-[26px] font-semibold tracking-tight">
          Watch the quick tutorial
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A 60-second walkthrough of getting your attendance screenshot.
        </p>
      </div>

      <motion.div
        key={nonce}
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative aspect-video w-full overflow-hidden rounded-[28px]"
      >
        {VIDEO_SRC && playing ? (
          <video src={VIDEO_SRC} controls autoPlay className="size-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div
              className="absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 40%, oklch(1 0 0 / 70%) 0%, oklch(1 0 0 / 0%) 70%)",
              }}
            />
            <div className="relative flex flex-col items-center gap-4">
              <motion.button
                type="button"
                aria-label="Play tutorial video"
                onClick={() => setPlaying(true)}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.05 }}
                className="grid size-20 place-items-center rounded-full bg-[image:var(--gradient-ink)] text-ink-foreground shadow-float"
              >
                <Play className="size-8 translate-x-0.5" fill="currentColor" />
              </motion.button>
              <div className="text-center">
                <p className="font-display text-lg font-semibold tracking-tight">Tutorial Video</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {playing ? "Video coming soon" : "Video Placeholder"}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setNonce((n) => n + 1);
          }}
          className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-transform duration-300 hover:-translate-y-0.5"
        >
          <RotateCcw className="size-4" /> Replay
        </button>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <SkipForward className="size-4" /> Skip
          </button>
        ) : null}
      </div>
    </div>
  );
}
