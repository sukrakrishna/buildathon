import Link from "next/link";
import { ArrowRight, Megaphone, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfilesMap } from "@/lib/data/profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CourseCard } from "@/components/site/course-card";
import { StudyTipsWidget } from "@/components/ai/study-tips-widget";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, initials } from "@/lib/format";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: announcements }, { data: courses }, { data: teachers }] = await Promise.all([
    supabase.from("announcements").select("*").order("published_at", { ascending: false }).limit(3),
    supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("rating", { ascending: false })
      .limit(6),
    supabase.from("profiles").select("*").eq("role", "teacher").limit(4),
  ]);

  const teacherMap = await getProfilesMap(
    supabase,
    (courses ?? []).map((c) => c.teacher_id)
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ai/30 bg-ai-soft px-3 py-1 text-xs font-medium text-ai">
              <Sparkles className="size-3.5" />
              Now with an AI performance engine
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              Run your school with clarity, not spreadsheets.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              Courses, attendance, assignments, and exams in one place — plus an AI
              engine that flags at-risk students and recommends what to study next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/courses">
                  Explore courses <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Get started free</Link>
              </Button>
            </div>
          </div>
          <StudyTipsWidget />
        </div>
      </section>

      {/* Announcements */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Megaphone className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Announcements</h2>
        </div>
        {announcements && announcements.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <CardContent className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">{formatDate(a.published_at)}</p>
                  <h3 className="font-medium leading-snug">{a.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No announcements yet" description="Check back soon for updates from the school." />
        )}
      </section>

      {/* Featured courses */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Featured courses</h2>
            <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {courses && courses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  index={i}
                  course={{
                    slug: course.slug,
                    title: course.title,
                    category: course.category,
                    level: course.level,
                    rating: Number(course.rating),
                    teacherName: course.teacher_id ? teacherMap.get(course.teacher_id)?.full_name ?? null : null,
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No courses published yet"
              description="Once an admin or teacher publishes a course, it'll show up here."
            />
          )}
        </div>
      </section>

      {/* Top teachers */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-semibold">Top teachers</h2>
        {teachers && teachers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {teachers.map((teacher) => (
              <Card key={teacher.id}>
                <CardContent className="flex flex-col items-center gap-3 text-center">
                  <Avatar className="size-16">
                    <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                      {initials(teacher.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{teacher.full_name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.bio ?? "Faculty"}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No teachers yet" description="Teacher profiles will appear here once they join." />
        )}
      </section>

      {/* CTA */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to see your progress clearly?</h2>
          <p className="mx-auto mt-2 max-w-xl text-primary-foreground/80">
            Create a free account to enroll in courses and unlock your personalized AI
            performance dashboard.
          </p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link href="/register">
              Get started <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
