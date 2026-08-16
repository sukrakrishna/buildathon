import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfilesMap } from "@/lib/data/profiles";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { CourseDialog } from "@/components/admin/course-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteCourseAction } from "@/lib/actions/admin";

export const metadata = { title: "Courses" };

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const [{ data: courses }, { data: teachers }] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").eq("role", "teacher").order("full_name"),
  ]);

  const teacherMap = await getProfilesMap(supabase, (courses ?? []).map((c) => c.teacher_id));
  const teacherOptions = (teachers ?? []).map((t) => ({ id: t.id, full_name: t.full_name }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CourseDialog teachers={teacherOptions} />
      </div>

      {courses && courses.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.teacher_id ? teacherMap.get(course.teacher_id)?.full_name ?? "—" : "Unassigned"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{course.category ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={course.is_published ? "secondary" : "outline"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <CourseDialog course={course} teachers={teacherOptions} />
                      <ConfirmDeleteButton itemLabel="course" action={deleteCourseAction.bind(null, course.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={BookOpen} title="No courses yet" description="Create your first course to get started." />
      )}
    </div>
  );
}
