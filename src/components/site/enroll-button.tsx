"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enrollInClassAction } from "@/lib/actions/enrollment";

export function EnrollButton({
  classId,
  courseSlug,
  isAuthenticated,
  disabled,
}: {
  classId: string;
  courseSlug: string;
  isAuthenticated: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <Button
        size="sm"
        onClick={() => router.push(`/login?next=/courses/${courseSlug}`)}
      >
        <UserPlus /> Enroll now
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const { error } = await enrollInClassAction(classId, courseSlug);
          if (error) toast.error(error);
          else {
            toast.success("You're enrolled!");
            router.refresh();
          }
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
      Enroll now
    </Button>
  );
}
