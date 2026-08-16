"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Loader2, Presentation, ShieldCheck } from "lucide-react";
import { signInAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const DEMO_ACCOUNTS = [
  {
    key: "student",
    label: "Student — Ethan Brooks",
    hint: "at-risk, see the AI Risk Center",
    email: "demo.student6@example.com",
    icon: GraduationCap,
  },
  {
    key: "teacher",
    label: "Teacher — Dr. Sarah Kim",
    hint: "mark attendance, grade, view students",
    email: "demo.teacher1@example.com",
    icon: Presentation,
  },
  {
    key: "admin",
    label: "Admin — Alex Admin",
    hint: "system-wide risk monitoring",
    email: "demo.admin@example.com",
    icon: ShieldCheck,
  },
] as const;

const DEMO_PASSWORD = "Demo1234!";

export function QuickDemoLogin() {
  const [pending, startTransition] = useTransition();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  function handleClick(email: string, key: string) {
    setActiveKey(key);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", DEMO_PASSWORD);
      formData.set("next", "");
      const result = await signInAction({ error: null }, formData);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="w-full max-w-sm space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold">Try it instantly — no signup</p>
      <p className="text-xs text-muted-foreground">
        Real seeded data, one click. Password for all: <code className="rounded bg-muted px-1 py-0.5">{DEMO_PASSWORD}</code>
      </p>
      <div className="space-y-2">
        {DEMO_ACCOUNTS.map((acct) => {
          const Icon = acct.icon;
          const isActive = pending && activeKey === acct.key;
          return (
            <Button
              key={acct.key}
              type="button"
              variant="outline"
              className="h-auto w-full justify-start gap-3 py-2.5"
              disabled={pending}
              onClick={() => handleClick(acct.email, acct.key)}
            >
              {isActive ? <Loader2 className="animate-spin" /> : <Icon className="text-ai" />}
              <span className="flex flex-col items-start text-left">
                <span className="text-sm font-medium">{acct.label}</span>
                <span className="text-xs text-muted-foreground">{acct.hint}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
