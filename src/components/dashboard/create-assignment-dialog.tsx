"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { createAssignmentAction } from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateAssignmentDialog({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const { error } = await createAssignmentAction({
        classId,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        dueDate: String(formData.get("due_date") ?? ""),
        maxScore: Number(formData.get("max_score") ?? 100),
      });
      if (error) toast.error(error);
      else {
        toast.success("Assignment created");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> New assignment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New assignment</DialogTitle>
          <DialogDescription>Students in this class will be able to submit their work.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Problem Set 3" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Instructions</Label>
            <Textarea id="description" name="description" rows={4} placeholder="What should students do?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_score">Max score</Label>
              <Input id="max_score" name="max_score" type="number" defaultValue={100} min={1} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
