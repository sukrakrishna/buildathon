"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { updateProfileAction, type ProfileFormState } from "@/lib/actions/profile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";
import type { Profile } from "@/types/database";

const initialState: ProfileFormState = { error: null, success: false };

export function ProfileForm({ profile, email }: { profile: Profile; email: string | null }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <AlertDescription>Profile updated.</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
            {initials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">{email}</p>
          <Badge variant="secondary" className="mt-1 capitalize">{profile.role}</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={profile.full_name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} placeholder="Optional" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={4} defaultValue={profile.bio ?? ""} placeholder="A short bio (shown to students on course pages if you teach)" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
