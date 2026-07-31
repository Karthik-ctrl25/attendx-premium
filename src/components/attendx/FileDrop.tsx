import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImageUp, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
  busy?: boolean;
  busyLabel?: string;
  title: string;
  hint: string;
}

const ACCEPT = ["image/png", "image/jpeg", "image/jpg"];

export function FileDrop({ onFile, busy, busyLabel, title, hint }: Props) {
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    (file?: File | null) => {
      if (!file) return;
      if (!ACCEPT.includes(file.type)) {
        setError("Only PNG, JPG and JPEG screenshots are supported.");
        return;
      }
      setError("");
      onFile(file);
    },
    [onFile],
  );

  return (
    <div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.99 }}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "glass flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-dashed px-6 py-14 text-center transition-all",
          over && "scale-[1.01] border-foreground/30 bg-white/70",
          busy && "opacity-70",
        )}
      >
        <div className="grid size-14 place-items-center rounded-2xl bg-white/70 shadow-soft">
          {busy ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <ImageUp className="size-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-display text-base font-semibold">{busy ? busyLabel : title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{busy ? "Reading your screenshot…" : hint}</p>
        </div>
      </motion.button>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {error ? <p className="mt-2 text-sm text-bad">{error}</p> : null}
    </div>
  );
}
