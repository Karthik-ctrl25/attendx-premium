import { motion } from "framer-motion";
import { RotateCcw, SkipForward } from "lucide-react";
import { useRef, useState } from "react";
import tutorialAsset from "@/assets/tutorial.mp4.asset.json";

const VIDEO_SRC = tutorialAsset.url;

export function TutorialVideo({ onSkip }: { onSkip?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          controls
          playsInline
          preload="metadata"
          className="size-full object-cover"
        />
      </motion.div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const v = videoRef.current;
            if (v) {
              v.currentTime = 0;
              void v.play();
            }
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
