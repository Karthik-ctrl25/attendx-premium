import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

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
