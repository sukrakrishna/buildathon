import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { RiskBadge } from "@/components/ai/risk-badge";
import { RoleSelect } from "@/components/admin/role-select";
import { initials, formatDate } from "@/lib/format";
import type { RiskLevel } from "@/types/database";

export const metadata = { title: "Students" };

export default async function AdminStudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const studentIds = (students ?? []).map((s) => s.id);
  const { data: insights } = studentIds.length
    ? await supabase
        .from("ai_insights")
        .select("student_id, risk_level, generated_at")
        .in("student_id", studentIds)
        .order("generated_at", { ascending: false })
    : { data: [] as { student_id: string; risk_level: RiskLevel; generated_at: string }[] };

  const latestRisk = new Map<string, RiskLevel>();
  for (const i of insights ?? []) {
    if (!latestRisk.has(i.student_id)) latestRisk.set(i.student_id, i.risk_level);
  }

  if (!students || students.length === 0) {
    return <EmptyState icon={Users} title="No students yet" description="Students will appear here once they register." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="text-right">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials(s.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{s.full_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(s.created_at)}</TableCell>
              <TableCell>
                {latestRisk.has(s.id) ? (
                  <RiskBadge level={latestRisk.get(s.id)!} />
                ) : (
                  <span className="text-xs text-muted-foreground">Not analyzed</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <RoleSelect userId={s.id} role={s.role} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
