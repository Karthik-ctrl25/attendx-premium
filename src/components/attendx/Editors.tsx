import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DAYS_SHORT, type ClassSlot, type SessionType, type Subject } from "@/lib/types";

const field =
  "h-9 rounded-xl border-white/70 bg-white/70 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-ring";

let n = 0;
const uid = () => `slot_${Date.now().toString(36)}_${(n += 1)}`;

export function TimetableEditor({
  slots,
  onChange,
}: {
  slots: ClassSlot[];
  onChange: (slots: ClassSlot[]) => void;
}) {
  const patch = (id: string, p: Partial<ClassSlot>) =>
    onChange(slots.map((s) => (s.id === id ? { ...s, ...p } : s)));

  return (
    <div className="space-y-3">
      {slots.map((slot) => (
        <div key={slot.id} className="glass rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select
              value={slot.day}
              onChange={(e) => patch(slot.id, { day: Number(e.target.value) })}
              className={`${field} px-2`}
            >
              {DAYS_SHORT.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <Input
              className={field}
              value={slot.start}
              onChange={(e) => patch(slot.id, { start: e.target.value })}
              placeholder="08:30"
            />
            <Input
              className={field}
              value={slot.end}
              onChange={(e) => patch(slot.id, { end: e.target.value })}
              placeholder="09:30"
            />
            <select
              value={slot.session}
              onChange={(e) => patch(slot.id, { session: e.target.value as SessionType })}
              className={`${field} px-2`}
            >
              <option value="Theory">Theory</option>
              <option value="Lab">Lab</option>
            </select>
            <Input
              className={field}
              value={slot.code}
              onChange={(e) => patch(slot.id, { code: e.target.value.toUpperCase() })}
              placeholder="Course code"
            />
            <Input
              className={`${field} sm:col-span-2`}
              value={slot.name}
              onChange={(e) => patch(slot.id, { name: e.target.value })}
              placeholder="Course name"
            />
            <Input
              className={field}
              value={slot.room}
              onChange={(e) => patch(slot.id, { room: e.target.value })}
              placeholder="Room"
            />
            <Input
              className={`${field} sm:col-span-3`}
              value={slot.faculty}
              onChange={(e) => patch(slot.id, { faculty: e.target.value })}
              placeholder="Faculty"
            />
            <Button
              variant="ghost"
              className="h-9 rounded-xl text-muted-foreground hover:text-bad"
              onClick={() => onChange(slots.filter((s) => s.id !== slot.id))}
            >
              <Trash2 className="size-4" /> Remove
            </Button>
          </div>
        </div>
      ))}

      <Button
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={() =>
          onChange([
            ...slots,
            {
              id: uid(),
              day: 1,
              start: "08:30",
              end: "09:30",
              code: "",
              name: "",
              faculty: "",
              room: "",
              session: "Theory",
            },
          ])
        }
      >
        <Plus className="size-4" /> Add class
      </Button>
    </div>
  );
}

export function SubjectsEditor({
  subjects,
  onChange,
  showCounts = true,
}: {
  subjects: Subject[];
  onChange: (subjects: Subject[]) => void;
  showCounts?: boolean;
}) {
  const patch = (code: string, p: Partial<Subject>) =>
    onChange(subjects.map((s) => (s.code === code ? { ...s, ...p } : s)));

  return (
    <div className="space-y-3">
      {subjects.map((s) => (
        <div key={s.code} className="glass rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input
              className={field}
              value={s.code}
              readOnly
              aria-label="Course code"
            />
            <Input
              className={`${field} sm:col-span-2`}
              value={s.name}
              onChange={(e) => patch(s.code, { name: e.target.value })}
              placeholder="Course name"
            />
            <Input
              className={field}
              value={s.faculty}
              onChange={(e) => patch(s.code, { faculty: e.target.value })}
              placeholder="Faculty"
            />
            {showCounts ? (
              <>
                <label className="text-xs text-muted-foreground">
                  Present
                  <Input
                    className={field}
                    type="number"
                    min={0}
                    value={s.present}
                    onChange={(e) =>
                      patch(s.code, { present: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Absent
                  <Input
                    className={field}
                    type="number"
                    min={0}
                    value={s.absent}
                    onChange={(e) =>
                      patch(s.code, { absent: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Total
                  <Input
                    className={field}
                    type="number"
                    min={0}
                    value={s.total}
                    onChange={(e) =>
                      patch(s.code, { total: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </label>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    className="h-9 w-full rounded-xl text-muted-foreground hover:text-bad"
                    onClick={() => onChange(subjects.filter((x) => x.code !== s.code))}
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
