import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { STATUS_COLOR, statusOf } from "@/lib/attendance";

interface Props {
  value: number;
  total?: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function AttendanceRing({
  value,
  total = 1,
  size = 168,
  stroke = 13,
  label,
  sublabel,
  className,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const color = STATUS_COLOR[statusOf(clamped, total)];

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(1 0 0 / 55%)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="tnum font-display text-3xl font-semibold tracking-tight">
          {label ?? `${Math.round(clamped)}%`}
        </span>
        {sublabel ? (
          <span className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
