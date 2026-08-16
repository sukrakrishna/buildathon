import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { NavbarUserMenu } from "@/components/site/navbar-user-menu";
import { MobileNav } from "@/components/site/mobile-nav";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/contact", label: "Contact" },
];

export async function Navbar() {
  const session = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <NavbarUserMenu profile={session.profile} />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <MobileNav links={LINKS} session={session ? { profile: session.profile } : null} />
      </div>
    </header>
  );
}
