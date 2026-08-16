import { Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfilesMap } from "@/lib/data/profiles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ClassDialog } from "@/components/admin/class-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteClassAction } from "@/lib/actions/admin";

export const metadata = { title: "Classes" };

export default async function AdminClassesPage() {
  const supabase = await createClient();

  const [{ data: classes }, { data: courses }, { data: teachers }] = await Promise.all([
    supabase.from("classes").select("*").order("created_at", { ascending: false }),
    supabase.from("courses").select("id, title").order("title"),
    supabase.from("profiles").select("id, full_name").eq("role", "teacher").order("full_name"),
  ]);

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));
  const teacherMap = await getProfilesMap(supabase, (classes ?? []).map((c) => c.teacher_id));

  const { data: enrollments } = classes && classes.length
    ? await supabase.from("enrollments").select("class_id").in("class_id", classes.map((c) => c.id)).eq("status", "active")
    : { data: [] as { class_id: string }[] };
  const countByClass = new Map<string, number>();
  for (const e of enrollments ?? []) countByClass.set(e.class_id, (countByClass.get(e.class_id) ?? 0) + 1);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ClassDialog
          courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title }))}
          teachers={(teachers ?? []).map((t) => ({ id: t.id, full_name: t.full_name }))}
        />
      </div>

      {classes && classes.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{courseMap.get(c.course_id) ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.teacher_id ? teacherMap.get(c.teacher_id)?.full_name ?? "—" : "Unassigned"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {countByClass.get(c.id) ?? 0}{c.capacity ? ` / ${c.capacity}` : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <ConfirmDeleteButton itemLabel="class" action={deleteClassAction.bind(null, c.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={Users2} title="No classes yet" description="Create a class to start enrolling students." />
      )}
    </div>
  );
}
