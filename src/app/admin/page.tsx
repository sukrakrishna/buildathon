import Link from "next/link";
import { BookOpen, Mail, Presentation, Sparkles, Users, Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfilesMap } from "@/lib/data/profiles";
import { Card, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { RiskBadge } from "@/components/ai/risk-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format";
import type { RiskLevel } from "@/types/database";

export const metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: studentCount }, { count: teacherCount }, { count: courseCount }, { count: classCount }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("*", { count: "exact", head: true }),
    ]);

  const { data: insights } = await supabase
    .from("ai_insights")
    .select("student_id, risk_level, summary, generated_at")
    .order("generated_at", { ascending: false })
    .limit(100);

  const latestByStudent = new Map<string, { risk_level: RiskLevel; summary: string | null; generated_at: string }>();
  for (const i of insights ?? []) {
    if (!latestByStudent.has(i.student_id)) {
      latestByStudent.set(i.student_id, { risk_level: i.risk_level, summary: i.summary, generated_at: i.generated_at });
    }
  }
  const atRisk = [...latestByStudent.entries()]
    .filter(([, v]) => v.risk_level === "high")
    .slice(0, 5);
  const profileMap = await getProfilesMap(supabase, atRisk.map(([sid]) => sid));

  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Users} label="Students" value={String(studentCount ?? 0)} />
        <StatTile icon={Presentation} label="Teachers" value={String(teacherCount ?? 0)} />
        <StatTile icon={BookOpen} label="Courses" value={String(courseCount ?? 0)} />
        <StatTile icon={Users2} label="Classes" value={String(classCount ?? 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="size-4 text-ai" /> At-risk students
            </h3>
            <Link href="/admin/ai-monitoring" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {atRisk.length > 0 ? (
            <div className="space-y-3">
              {atRisk.map(([sid, v]) => (
                <Card key={sid}>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{profileMap.get(sid)?.full_name ?? "Student"}</p>
                      <p className="truncate text-sm text-muted-foreground">{v.summary}</p>
                    </div>
                    <RiskBadge level={v.risk_level} className="shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={Sparkles} title="No at-risk students flagged" description="Generate AI insights from a student's progress page to populate this." />
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 font-semibold">
              <Mail className="size-4 text-primary" /> Recent contact messages
            </h3>
          </div>
          {messages && messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((m) => (
                <Card key={m.id}>
                  <CardContent className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{m.name}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(m.created_at)}</span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{m.subject || m.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={Mail} title="No messages yet" description="Messages from the public contact form will appear here." />
          )}
        </div>
      </div>
    </div>
  );
}
