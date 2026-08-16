"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateUserRoleAction } from "@/lib/actions/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserRole } from "@/types/database";

export function RoleSelect({ userId, role }: { userId: string; role: UserRole }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(value: string) {
    startTransition(async () => {
      const { error } = await updateUserRoleAction(userId, value as UserRole);
      if (error) toast.error(error);
      else {
        toast.success("Role updated");
        router.refresh();
      }
    });
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-28 capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">Student</SelectItem>
        <SelectItem value="teacher">Teacher</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
