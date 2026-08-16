import Link from "next/link";
import { BookOpen, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CourseCardData {
  slug: string;
  title: string;
  category: string | null;
  level: string | null;
  rating: number;
  teacherName: string | null;
  studentCount?: number;
}

const GRADIENTS = [
  "from-primary/25 via-primary/10 to-transparent",
  "from-ai/25 via-ai/10 to-transparent",
  "from-success/25 via-success/10 to-transparent",
  "from-warning/25 via-warning/10 to-transparent",
];

export function CourseCard({ course, index = 0 }: { course: CourseCardData; index?: number }) {
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group h-full overflow-hidden py-0 transition-shadow hover:shadow-lg">
        <div className={cn("flex h-32 items-center justify-center bg-gradient-to-br", gradient)}>
          <BookOpen className="size-10 text-foreground/40" strokeWidth={1.5} />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            {course.category && (
              <Badge variant="secondary" className="font-normal">
                {course.category}
              </Badge>
            )}
            {course.level && (
              <Badge variant="outline" className="font-normal capitalize">
                {course.level}
              </Badge>
            )}
          </div>
          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
            {course.title}
          </h3>
          <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
            <span className="truncate">{course.teacherName ?? "Staff"}</span>
            <span className="flex items-center gap-1 shrink-0">
              <Star className="size-3.5 fill-warning text-warning" />
              {course.rating > 0 ? course.rating.toFixed(1) : "New"}
            </span>
          </div>
          {typeof course.studentCount === "number" && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              {course.studentCount} enrolled
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
