import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, UserX, UserCheck, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/attendx/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminListClassScopes,
  adminListStudents,
  adminResetOnboarding,
  adminSetStudentDisabled,
} from "@/lib/admin.functions";
import type { AdminStudent } from "@/lib/admin.types";
import { DEPARTMENTS, SECTIONS, SEMESTERS } from "@/lib/timetable-dataset";

const filterClass =
  "h-10 w-full rounded-2xl border border-foreground/10 bg-transparent px-3 text-[12.5px]";

export function AdminStudents() {
  const qc = useQueryClient();
  const list = useServerFn(adminListStudents);
  const setDisabled = useServerFn(adminSetStudentDisabled);
  const resetOnboarding = useServerFn(adminResetOnboarding);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState<AdminStudent | null>(null);

  const filters = { search, department, semester, section };
  const { data: students, isLoading } = useQuery({
    queryKey: ["admin", "students", filters],
    queryFn: () => list({ data: filters }),
  });

  const listScopes = useServerFn(adminListClassScopes);
  const { data: scopes } = useQuery({ queryKey: ["admin", "scopes"], queryFn: () => listScopes({}) });
  const departments = [
    ...new Set<string>([...DEPARTMENTS, ...(scopes ?? []).map((s) => s.department)]),
  ].sort();
  const semesters = [
    ...new Set<string>([...SEMESTERS, ...(scopes ?? []).map((s) => s.semester)]),
  ].sort();
  const sections = [
    ...new Set<string>([...SECTIONS, ...(scopes ?? []).map((s) => s.section)]),
  ].sort();

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin", "students"] });

  const toggle = useMutation({
    mutationFn: (v: { userId: string; disabled: boolean }) => setDisabled({ data: v }),
    onSuccess: (_r, v) => {
      invalidate();
      toast.success(v.disabled ? "Account disabled" : "Account enabled");
    },
    onError: () => toast.error("Could not update the account"),
  });

  const reset = useMutation({
    mutationFn: (userId: string) => resetOnboarding({ data: { userId } }),
    onSuccess: () => {
      invalidate();
      toast.success("Onboarding reset");
    },
    onError: () => toast.error("Could not reset onboarding"),
  });

  return (
    <div className="space-y-3">
      <GlassCard className="space-y-2.5 p-3.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, USN or email"
            className="h-10 rounded-2xl pl-9 text-[13px]"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={filterClass}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className={filterClass}
          >
            <option value="">All semesters</option>
            {semesters.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className={filterClass}
          >
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      <GlassCard className="divide-y divide-foreground/5 p-1.5">
        {isLoading ? (
          <p className="p-4 text-center text-[12.5px] text-muted-foreground">Loading students…</p>
        ) : (students?.length ?? 0) === 0 ? (
          <p className="p-4 text-center text-[12.5px] text-muted-foreground">No students found.</p>
        ) : (
          students!.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 px-2.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">
                  {s.student_name || "Unnamed"}{" "}
                  {s.disabled ? (
                    <span className="ml-1 rounded-full bg-bad/15 px-2 py-0.5 text-[10px] text-bad">
                      Disabled
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {[s.usn, s.department, s.semester, s.section].filter(Boolean).join(" · ") ||
                    s.email}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-xl px-2.5 text-[11.5px]"
                  onClick={() => setSelected(selected?.id === s.id ? null : s)}
                >
                  Profile
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-xl px-2.5 text-[11.5px]"
                  onClick={() => reset.mutate(s.id)}
                >
                  <RotateCcw className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant={s.disabled ? "default" : "secondary"}
                  className="h-8 rounded-xl px-2.5 text-[11.5px]"
                  onClick={() => toggle.mutate({ userId: s.id, disabled: !s.disabled })}
                >
                  {s.disabled ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
                </Button>
              </div>

              {selected?.id === s.id ? (
                <dl className="w-full rounded-2xl bg-foreground/[0.04] p-3 text-[12px]">
                  {[
                    ["Email", s.email],
                    ["USN", s.usn],
                    ["Department", s.department],
                    ["Semester", s.semester],
                    ["Section", s.section],
                    ["Onboarding", s.setup_complete ? "Complete" : "Pending"],
                    ["Joined", new Date(s.created_at).toLocaleDateString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 py-0.5">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="truncate font-medium">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          ))
        )}
      </GlassCard>
    </div>
  );
}
