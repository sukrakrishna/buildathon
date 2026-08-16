"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TeacherClass } from "@/lib/data/academics";

export function ClassPicker({ classes, value }: { classes: TeacherClass[]; value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(classId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("classId", classId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Select a class" />
      </SelectTrigger>
      <SelectContent>
        {classes.map((c) => (
          <SelectItem key={c.classId} value={c.classId}>
            {c.courseTitle} — {c.className}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
