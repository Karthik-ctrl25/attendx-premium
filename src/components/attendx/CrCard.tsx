import { ShieldQuestion } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClassSpace } from "@/lib/class-store";
import { useApp } from "@/lib/store";

/** Class Representative application — lives on the Class page. */
export function CrCard() {
  const { meta } = useApp();
  const { applyForCr } = useClassSpace();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const status = meta.crRequestStatus ?? "none";

  if ((meta.role ?? "student") !== "student") return null;

  return (
    <GlassCard className="space-y-2.5 px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/70 shadow-soft">
          <ShieldQuestion className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">Class Representative</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {status === "pending"
              ? "Application submitted · pending approval"
              : status === "rejected"
                ? "Your last application was not approved"
                : "Apply and an admin will review your request"}
          </p>
        </div>
        {status === "pending" || open ? null : (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 shrink-0 rounded-xl px-3 text-[11.5px]"
            onClick={() => setOpen(true)}
          >
            Apply
          </Button>
        )}
      </div>

      {status !== "pending" && open ? (
        <div className="space-y-2">
          <Textarea
            rows={2}
            placeholder="Why should you be the CR?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl border-white/70 bg-white/80 text-[12.5px]"
          />
          <Button
            size="sm"
            className="w-full rounded-xl"
            disabled={reason.trim().length < 5}
            onClick={async () => {
              await applyForCr(reason);
              setOpen(false);
              setReason("");
              toast.success("Application submitted — pending approval");
            }}
          >
            Submit application
          </Button>
        </div>
      ) : null}
    </GlassCard>
  );
}
