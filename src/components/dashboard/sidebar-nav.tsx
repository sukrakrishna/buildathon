"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  Presentation,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Server Components can't pass component references (like a LucideIcon) as
// props into a Client Component — RSC serialization only supports plain
// data. So NavItem carries an icon *name*, resolved to a component here,
// entirely on the client side.
const ICONS = {
  dashboard: LayoutDashboard,
  attendance: CalendarCheck,
  assignments: ClipboardList,
  exams: GraduationCap,
  students: Users,
  reports: FileBarChart,
  progress: TrendingUp,
  admin: ShieldCheck,
  courses: BookOpen,
  ai: Sparkles,
  classes: Users2,
  teachers: Presentation,
} as const;

export type IconName = keyof typeof ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === "/dashboard" || item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
