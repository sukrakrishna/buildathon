import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import type { NavItem } from "@/components/dashboard/sidebar-nav";

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/students", label: "Students", icon: "students" },
  { href: "/admin/teachers", label: "Teachers", icon: "teachers" },
  { href: "/admin/courses", label: "Courses", icon: "courses" },
  { href: "/admin/classes", label: "Classes", icon: "classes" },
  { href: "/admin/ai-monitoring", label: "AI Monitoring", icon: "ai" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(["admin"]);

  return (
    <AppShell profile={profile} items={ITEMS} homeLabel="Admin console">
      {children}
    </AppShell>
  );
}
