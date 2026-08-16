import { requireUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { profile, email } = await requireUser();

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardContent>
          <ProfileForm profile={profile} email={email} />
        </CardContent>
      </Card>
    </div>
  );
}
