"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { createExamAction } from "@/lib/actions/exams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateExamDialog({ classId, defaultSubject }: { classId: string; defaultSubject: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const { error } = await createExamAction({
        classId,
        title: String(formData.get("title") ?? ""),
        subject: String(formData.get("subject") ?? ""),
        examDate: String(formData.get("exam_date") ?? ""),
        maxScore: Number(formData.get("max_score") ?? 100),
      });
      if (error) toast.error(error);
      else {
        toast.success("Exam created");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> New exam
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New exam</DialogTitle>
          <DialogDescription>You'll be able to enter grades once it's created.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Midterm Exam" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" defaultValue={defaultSubject} placeholder="Mathematics" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam_date">Exam date</Label>
              <Input id="exam_date" name="exam_date" type="datetime-local" />
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
