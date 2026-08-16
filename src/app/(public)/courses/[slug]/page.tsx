import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, CalendarDays, MapPin, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getProfilesMap } from "@/lib/data/profiles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EnrollButton } from "@/components/site/enroll-button";
import { initials } from "@/lib/format";

export default async function CourseDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const session = await getCurrentUser();

  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
  if (!course || (!course.is_published && session?.profile.role !== "admin" && session?.id !== course.teacher_id)) {
    notFound();
  }

  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("course_id", course.id)
    .order("start_date", { ascending: true });

  const classIds = (classes ?? []).map((c) => c.id);
  const { data: enrollments } = classIds.length
    ? await supabase.from("enrollments").select("class_id, student_id").in("class_id", classIds)
    : { data: [] as { class_id: string; student_id: string }[] };

  const teacherIds = [course.teacher_id, ...(classes ?? []).map((c) => c.teacher_id)];
  const teacherMap = await getProfilesMap(supabase, teacherIds);
  const mainTeacher = course.teacher_id ? teacherMap.get(course.teacher_id) : undefined;

  const isStudent = session?.profile.role === "student";
  const myEnrolledClassIds = new Set(
    isStudent ? (enrollments ?? []).filter((e) => e.student_id === session!.id).map((e) => e.class_id) : []
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        {course.category && <Badge variant="secondary">{course.category}</Badge>}
        {course.level && <Badge variant="outline" className="capitalize">{course.level}</Badge>}
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="size-3.5 fill-warning text-warning" />
          {Number(course.rating) > 0 ? Number(course.rating).toFixed(1) : "New course"}
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="size-4.5 text-primary" /> Syllabus
            </h2>
            <p className="whitespace-pre-line text-muted-foreground">
              {course.description || "No syllabus has been added for this course yet."}
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="size-4.5 text-primary" /> Sections & schedule
            </h2>
            {classes && classes.length > 0 ? (
              <div className="space-y-4">
                {classes.map((cls) => {
                  const enrolledCount = (enrollments ?? []).filter((e) => e.class_id === cls.id).length;
                  const isFull = cls.capacity ? enrolledCount >= cls.capacity : false;
                  const alreadyIn = myEnrolledClassIds.has(cls.id);
                  const classTeacher = cls.teacher_id ? teacherMap.get(cls.teacher_id) : mainTeacher;

                  return (
                    <Card key={cls.id}>
                      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{cls.name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {cls.schedule && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="size-3.5" /> {cls.schedule}
                              </span>
                            )}
                            {cls.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3.5" /> {cls.room}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="size-3.5" /> {enrolledCount}
                              {cls.capacity ? ` / ${cls.capacity}` : ""}
                            </span>
                          </div>
                          {classTeacher && (
                            <p className="text-xs text-muted-foreground">Taught by {classTeacher.full_name}</p>
                          )}
                        </div>
                        <div>
                          {alreadyIn ? (
                            <Badge className="bg-success/15 text-success border-success/30">Enrolled</Badge>
                          ) : isFull ? (
                            <Badge variant="secondary">Full</Badge>
                          ) : isStudent || !session ? (
                            <EnrollButton
                              classId={cls.id}
                              courseSlug={slug}
                              isAuthenticated={!!session}
                              disabled={isFull}
                            />
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sections have been scheduled yet.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardContent>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Instructor</h3>
              {mainTeacher ? (
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                      {initials(mainTeacher.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{mainTeacher.full_name}</p>
                    <p className="text-xs text-muted-foreground">Lead instructor</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not yet assigned.</p>
              )}
            </CardContent>
          </Card>

          {session?.id === course.teacher_id && (
            <ManageLinkCard href={`/dashboard/assignments`}>Manage this course</ManageLinkCard>
          )}
          {session?.profile.role === "admin" && (
            <ManageLinkCard href={`/admin/courses`}>Manage in admin</ManageLinkCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function ManageLinkCard({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border bg-card px-4 py-3 text-center text-sm font-medium hover:bg-accent"
    >
      {children}
    </Link>
  );
}
