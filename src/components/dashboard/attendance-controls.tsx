"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ClassPicker } from "@/components/dashboard/class-picker";
import type { TeacherClass } from "@/lib/data/academics";

export function AttendanceControls({
  classes,
  classId,
  date,
}: {
  classes: TeacherClass[];
  classId: string;
  date: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleDateChange(newDate: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", newDate);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <ClassPicker classes={classes} value={classId} />
      <Input
        type="date"
        value={date}
        onChange={(e) => handleDateChange(e.target.value)}
        className="w-full sm:w-44"
      />
    </div>
  );
}
