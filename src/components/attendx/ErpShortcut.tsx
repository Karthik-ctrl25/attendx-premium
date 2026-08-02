import { ExternalLink } from "lucide-react";

import { ERP_LOGIN_URL } from "@/lib/class-store";
import { cn } from "@/lib/utils";

/**
 * ERP shortcut shown above every attendance upload area.
 *
 * Opens the official CMR ERP in the device browser (never an embedded webview).
 * AttendX state lives in this tab, so returning restores the exact same screen.
 */
export function ErpShortcut({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <a
        href={ERP_LOGIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="glass glass-hover flex min-w-0 items-center gap-3 rounded-3xl px-4 py-3.5"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/70 shadow-soft">
          <ExternalLink className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Open CMR ERP</p>
          <p className="truncate text-xs text-muted-foreground">
            erp.cmr.edu.in · opens in browser
          </p>
        </div>
      </a>
      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        Open ERP → Login → Take Screenshot → Return Here → Upload
      </p>
    </div>
  );
}
