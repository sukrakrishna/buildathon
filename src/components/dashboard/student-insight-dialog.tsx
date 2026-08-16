"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InsightPanel } from "@/components/ai/insight-panel";

export function StudentInsightDialog({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="text-ai" /> View insight
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{studentName}'s AI insight</DialogTitle>
        </DialogHeader>
        {open && <InsightPanel studentId={studentId} studentName={studentName} initialInsight={null} canRegenerate />}
      </DialogContent>
    </Dialog>
  );
}
