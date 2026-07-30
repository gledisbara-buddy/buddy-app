"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useBuddy } from "@/lib/buddy-context";

const LINKS = [
  { href: "/", label: "Hem" },
  { href: "/forsakringar", label: "Försäkringar" },
  { href: "/guider", label: "Guider" },
  { href: "/nyheter", label: "Nyheter" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/jobb", label: "Jobb" },
  { href: "/vanliga-fragor", label: "Vanliga frågor" },
  { href: "/kontakt", label: "Kontakt" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const { userType } = useBuddy();

  return (
    <header
      className="w-full flex items-center justify-between gap-4 px-5 md:px-10 py-4 border-b border-line flex-wrap"
      style={{ background: "rgba(239,244,243,0.9)" }}
    >
      <Logo />
      <nav className="flex items-center gap-1 flex-wrap">
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-full text-sm font-medium"
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
      {userType ? (
        <ProfileMenu />
      ) : (
        <Link
          href="/kom-igang"
          className="bd-btn px-4 py-2 rounded-full text-sm font-semibold text-white bg-forest flex-none"
        >
          Logga in
        </Link>
      )}
    </header>
  );
}
