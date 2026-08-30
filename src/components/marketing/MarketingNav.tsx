"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy } from "@/lib/buddy-context";

const LINKS = [
  { href: "/", label: "Hem" },
  { href: "/jamfor", label: "Jämför" },
  { href: "/guider", label: "Guider" },
  { href: "/nyheter", label: "Nyheter" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/jobb", label: "Jobb" },
  { href: "/vanliga-fragor", label: "Vanliga frågor" },
  { href: "/kontakt", label: "Kontakt" },
];

function NavLinks({ pathname, className }: { pathname: string; className: string }) {
  return (
    <nav className={className}>
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-2 rounded-full text-sm font-medium flex-none whitespace-nowrap"
            style={{
              color: active ? "var(--color-forest)" : "var(--color-ink)",
              background: active ? "var(--color-frost-2)" : "transparent",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MarketingNav() {
  const pathname = usePathname();
  const { userType } = useBuddy();

  return (
    <header className="w-full border-b border-line" style={{ background: "var(--color-frost-90)" }}>
      <div className="flex items-center justify-between gap-4 px-5 md:px-10 py-4">
        <Logo />
        <NavLinks pathname={pathname} className="hidden md:flex items-center gap-1" />
        {userType ? (
          <ProfileMenu />
        ) : (
          <Link
            href="/login?type=privat&mode=login"
            className="bd-btn px-4 py-2 rounded-full text-sm font-semibold text-white bg-forest flex-none"
          >
            Logga in
          </Link>
        )}
      </div>
      {/* Egen, horisontellt skrollbar rad på mobilen istället för att
          radbryta 8 länkar till tre rader — samma mönster som TabBar.tsx
          använder i inloggat läge. */}
      <NavLinks
        pathname={pathname}
        className="flex md:hidden items-center gap-1 overflow-x-auto px-5 pb-3 -mt-1"
      />
    </header>
  );
}
