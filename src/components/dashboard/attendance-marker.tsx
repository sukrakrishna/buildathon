"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle, Clock, FileWarning } from "lucide-react";
import { markAttendanceAction } from "@/lib/actions/attendance";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { AttendanceStatus } from "@/types/database";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  present: { label: "Present", icon: CheckCircle2, className: "border-success/40 bg-success/10 text-success" },
  late: { label: "Late", icon: Clock, className: "border-warning/40 bg-warning/10 text-warning" },
  excused: { label: "Excused", icon: FileWarning, className: "border-primary/40 bg-primary/10 text-primary" },
  absent: { label: "Absent", icon: XCircle, className: "border-danger/40 bg-danger/10 text-danger" },
};

const STATUSES: AttendanceStatus[] = ["present", "late", "excused", "absent"];

export function AttendanceMarker({
  classId,
  sessionDate,
  roster,
  initialStatuses,
}: {
  classId: string;
  sessionDate: string;
  roster: { id: string; full_name: string }[];
  initialStatuses: Record<string, AttendanceStatus>;
}) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(initialStatuses);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAllPresent() {
    setStatuses(Object.fromEntries(roster.map((s) => [s.id, "present" as AttendanceStatus])));
  }

  function handleSave() {
    startTransition(async () => {
      const records = roster.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? "present" }));
      const { error } = await markAttendanceAction(classId, sessionDate, records);
      if (error) toast.error(error);
      else {
        toast.success("Attendance saved");
        router.refresh();
      }
    });
  }

  if (roster.length === 0) {
    return <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={markAllPresent} type="button">
          Mark all present
        </Button>
      </div>

      <div className="divide-y rounded-xl border">
        {roster.map((student) => {
          const current = statuses[student.id] ?? "present";
          return (
            <div key={student.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials(student.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{student.full_name}</span>
              </div>
              <div className="flex gap-1.5">
                {STATUSES.map((status) => {
                  const cfg = STATUS_CONFIG[status];
                  const Icon = cfg.icon;
                  const active = current === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatus(student.id, status)}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        active ? cfg.className : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="size-3.5" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Save attendance
        </Button>
      </div>
    </div>
  );
}
