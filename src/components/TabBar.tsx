"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FolderOpen, Gift, HelpCircle, Home, Inbox, LayoutDashboard, Settings, Shield, User, type LucideIcon } from "lucide-react";
import { useBuddy } from "@/lib/buddy-context";

type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Översikt", icon: LayoutDashboard },
  { href: "/mina-arenden", label: "Ärenden", icon: Inbox },
  { href: "/hushall", label: "Hushåll", icon: Home },
  { href: "/arkiv", label: "Arkiv", icon: FolderOpen },
  { href: "/varva-en-van", label: "Värva", icon: Gift },
  { href: "/profil", label: "Profil", icon: User },
  { href: "/installningar", label: "Inställningar", icon: Settings },
  { href: "/vanliga-fragor", label: "Hjälp", icon: HelpCircle },
];

function isActive(pathname: string | null, href: string): boolean {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

// Ersätter den gamla ProfileMenu-dropdownen med en stående flikrad — synlig
// på alla huvudsidor, inte gömd bakom en avatar. Svep vänster/höger på
// mobilen hoppar till nästa/föregående flik i samma ordning som raden,
// så navigeringen känns likadan oavsett input-metod.
export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isEmployee } = useBuddy();

  const items = useMemo(
    () => (isEmployee ? [...NAV_ITEMS, { href: "/internt", label: "Internt", icon: Shield }] : NAV_ITEMS),
    [isEmployee]
  );

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if ((e.target as HTMLElement)?.closest?.("[data-no-swipe-nav]")) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      // Kräver en tydlig sidledes rörelse — annars räknas det som scroll.
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

      const idx = items.findIndex((item) => isActive(pathname, item.href));
      if (idx === -1) return;
      const nextIdx = dx < 0 ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= items.length) return;
      router.push(items[nextIdx].href);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [items, pathname, router]);

  return (
    <nav
      data-no-swipe-nav
      className="flex items-center gap-1 overflow-x-auto px-3 md:px-8 border-b border-line"
      style={{ background: "var(--color-frost-90)" }}
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 flex-none ${
              active ? "border-forest text-forest" : "border-transparent text-slate hover:text-ink"
            }`}
          >
            <Icon size={15} /> {item.label}
          </button>
        );
      })}
    </nav>
  );
}
