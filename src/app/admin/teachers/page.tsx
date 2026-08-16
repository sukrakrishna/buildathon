import { Presentation } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleSelect } from "@/components/admin/role-select";
import { initials, formatDate } from "@/lib/format";

export const metadata = { title: "Teachers" };

export default async function AdminTeachersPage() {
  const supabase = await createClient();

  const { data: teachers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });

  const teacherIds = (teachers ?? []).map((t) => t.id);
  const { data: classes } = teacherIds.length
    ? await supabase.from("classes").select("teacher_id").in("teacher_id", teacherIds)
    : { data: [] as { teacher_id: string | null }[] };

  const classCountByTeacher = new Map<string, number>();
  for (const c of classes ?? []) {
    if (!c.teacher_id) continue;
    classCountByTeacher.set(c.teacher_id, (classCountByTeacher.get(c.teacher_id) ?? 0) + 1);
  }

  if (!teachers || teachers.length === 0) {
    return <EmptyState icon={Presentation} title="No teachers yet" description="Teachers will appear here once they register." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teacher</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead className="text-right">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials(t.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{t.full_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(t.created_at)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{classCountByTeacher.get(t.id) ?? 0}</TableCell>
              <TableCell className="text-right">
                <RoleSelect userId={t.id} role={t.role} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
