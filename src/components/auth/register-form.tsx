"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, Presentation } from "lucide-react";
import { signUpAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { cn } from "@/lib/utils";

const initialState: AuthFormState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [role, setRole] = useState<"student" | "teacher">("student");

  if (state.notice) {
    return (
      <Alert>
        <AlertDescription>{state.notice}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <GoogleSignInButton />
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Joins as a student — an admin can switch you to teacher later.
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or register with email
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value={role} />
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>I am joining as a</Label>
        <div className="grid grid-cols-2 gap-3">
          <RoleCard
            label="Student"
            icon={GraduationCap}
            selected={role === "student"}
            onClick={() => setRole("student")}
          />
          <RoleCard
            label="Teacher"
            icon={Presentation}
            selected={role === "teacher"}
            onClick={() => setRole("teacher")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" placeholder="Ada Lovelace" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@school.edu" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm password</Label>
        <Input id="confirm_password" name="confirm_password" type="password" required autoComplete="new-password" minLength={8} />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Create account
      </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

function RoleCard({
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
        selected ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-foreground/30"
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
