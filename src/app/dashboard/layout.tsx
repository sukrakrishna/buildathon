import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import type { NavItem } from "@/components/dashboard/sidebar-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();

  const items: NavItem[] =
    profile.role === "admin"
      ? [
          { href: "/admin", label: "Admin console", icon: "admin" },
          { href: "/dashboard/attendance", label: "Attendance", icon: "attendance" },
          { href: "/dashboard/assignments", label: "Assignments", icon: "assignments" },
          { href: "/dashboard/exams", label: "Exams & Grades", icon: "exams" },
        ]
      : profile.role === "teacher"
        ? [
            { href: "/dashboard", label: "Overview", icon: "dashboard" },
            { href: "/dashboard/attendance", label: "Attendance", icon: "attendance" },
            { href: "/dashboard/assignments", label: "Assignments", icon: "assignments" },
            { href: "/dashboard/exams", label: "Exams & Grades", icon: "exams" },
            { href: "/dashboard/students", label: "Students", icon: "students" },
            { href: "/dashboard/reports", label: "Reports", icon: "reports" },
          ]
        : [
            { href: "/dashboard", label: "Overview", icon: "dashboard" },
            { href: "/dashboard/progress", label: "My Progress", icon: "progress" },
            { href: "/dashboard/attendance", label: "Attendance", icon: "attendance" },
            { href: "/dashboard/assignments", label: "Assignments", icon: "assignments" },
            { href: "/dashboard/exams", label: "Exams & Grades", icon: "exams" },
            { href: "/dashboard/reports", label: "Reports", icon: "reports" },
          ];

  return (
    <AppShell profile={profile} items={items} homeLabel="Dashboard">
      {children}
    </AppShell>
  );
}
