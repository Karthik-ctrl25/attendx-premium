import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  strong,
  hover,
  delay = 0,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={cn(
        strong ? "glass-strong" : "glass",
        hover && "glass-hover cursor-pointer",
        "rounded-3xl",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({
  title,
  action,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
