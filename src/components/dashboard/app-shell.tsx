"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav";
import { NavbarUserMenu } from "@/components/site/navbar-user-menu";
import type { Profile } from "@/types/database";

export function AppShell({
  profile,
  items,
  homeLabel,
  children,
}: {
  profile: Profile;
  items: NavItem[];
  homeLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const activeItem = [...items].sort((a, b) => b.href.length - a.href.length).find((item) => pathname.startsWith(item.href));
  const title = activeItem?.label ?? homeLabel;

  return (
    <div className="flex min-h-full flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
        <Logo className="px-2" />
        <div className="mt-8 flex-1">
          <SidebarNav items={items} />
        </div>
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to site
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>
                    <Logo />
                  </SheetTitle>
                </SheetHeader>
                <div className="px-4">
                  <SidebarNav items={items} />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <NavbarUserMenu profile={profile} />
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
