import { createClient } from "@/lib/supabase/server";
import { getProfilesMap } from "@/lib/data/profiles";
import { CourseCard } from "@/components/site/course-card";
import { CourseFilters } from "@/components/site/course-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchX } from "lucide-react";

export const metadata = { title: "Courses" };

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("courses").select("*").eq("is_published", true);
  if (q) query = query.ilike("title", `%${q}%`);
  if (category && category !== "all") query = query.eq("category", category);

  if (sort === "newest") query = query.order("created_at", { ascending: false });
  else if (sort === "title") query = query.order("title", { ascending: true });
  else query = query.order("rating", { ascending: false });

  const [{ data: courses }, { data: categoryRows }] = await Promise.all([
    query,
    supabase.from("courses").select("category").eq("is_published", true),
  ]);

  const categories = [...new Set((categoryRows ?? []).map((c) => c.category).filter((c): c is string => !!c))].sort();
  const teacherMap = await getProfilesMap(supabase, (courses ?? []).map((c) => c.teacher_id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Course catalog</h1>
        <p className="text-muted-foreground">Browse every course currently open for enrollment.</p>
      </div>

      <div className="mb-8">
        <CourseFilters categories={categories} />
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
          icon={SearchX}
          title="No courses found"
          description="Try a different search term or clear the filters."
        />
      )}
    </div>
  );
}
