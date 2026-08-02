import { useRef } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface StudentDetails {
  studentName: string;
  usn: string;
  email: string;
  photo: string;
}

const field = "h-11 rounded-2xl border-white/70 bg-white/70 text-sm shadow-none";

export const detailsReady = (d: StudentDetails) =>
  d.studentName.trim().length > 1 && d.usn.trim().length > 3;

/** Onboarding step 1 — who you are. Stored locally, never uploaded. */
export function DetailsStep({
  value,
  onChange,
}: {
  value: StudentDetails;
  onChange: (next: StudentDetails) => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<StudentDetails>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-[26px] font-semibold tracking-tight">Your details</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Used only on this device to personalise AttendX.
        </p>
      </div>

      <div className="glass flex items-center gap-4 rounded-[26px] p-4">
        {value.photo ? (
          <img
            src={value.photo}
            alt="Profile"
            className="size-16 shrink-0 rounded-full object-cover ring-1 ring-white/70"
          />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-ink)] text-sm font-semibold text-ink-foreground">
            {(value.studentName.trim()[0] ?? "A").toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">Optional</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 rounded-xl"
            onClick={() => photoRef.current?.click()}
          >
            <Upload className="size-3.5" /> Upload
          </Button>
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => set({ photo: String(reader.result) });
            reader.readAsDataURL(file);
          }}
        />
      </div>

      <div className="space-y-3">
        <Input
          className={field}
          placeholder="Full name"
          value={value.studentName}
          onChange={(e) => set({ studentName: e.target.value })}
        />
        <Input
          className={field}
          placeholder="USN (e.g. 24BSCS101)"
          value={value.usn}
          onChange={(e) => set({ usn: e.target.value.toUpperCase().replace(/\s+/g, "") })}
        />
        {/* Email comes from the signed-in account and cannot be edited. */}
        <div className="flex h-11 items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/50 px-3">
          <span className="text-[13px] text-muted-foreground">Email</span>
          <span className="min-w-0 truncate text-[13px] font-medium">{value.email || "—"}</span>
        </div>
      </div>
    </div>
  );
}
