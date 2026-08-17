"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FileBarChart,
  FolderOpen,
  Gift,
  HeartPulse,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Settings,
  Shield,
  Smartphone,
  User,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { useBuddy } from "@/lib/buddy-context";

type NavItem = { href: string; label: string; icon: LucideIcon };

// De fyra mest använda — Värva hålls synlig med avsikt eftersom
// tillväxt/värvning är huvudbudskapet inför investerarmötet, inte för att
// den är mest klickad i sig (se [[buddy_growth_demo_strategy]]).
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Översikt", icon: LayoutDashboard },
  { href: "/mina-arenden", label: "Ärenden", icon: Inbox },
  { href: "/hushall", label: "Hushåll", icon: Home },
  { href: "/varva-en-van", label: "Värva", icon: Gift },
];

// Bakom "Mer" — samma mönster som Folksams egen "Mer"-flik (Mina
// dokument/Mina uppgifter/Kontakta oss/GDPR/Villkor, plus Logga ut).
// Ersätter den tillfälliga "Genvägar"-sektionen på Inställningar (se
// SettingsPage.tsx) — permanent hemvist istället för interimslösning.
const MORE_ITEMS: NavItem[] = [
  { href: "/arkiv", label: "Arkiv", icon: FolderOpen },
  { href: "/profil", label: "Profil", icon: User },
  { href: "/installningar", label: "Inställningar", icon: Settings },
  { href: "/vanliga-fragor", label: "Hjälp", icon: HelpCircle },
  { href: "/identifiera-igen", label: "Identifiera dig igen", icon: Smartphone },
  { href: "/halsokoll", label: "Årlig hälsokoll", icon: HeartPulse },
  { href: "/arsrapport", label: "Din årsrapport", icon: FileBarChart },
];

function isActive(pathname: string | null, href: string): boolean {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

// Ersätter den gamla ProfileMenu-dropdownen med en stående flikrad — synlig
// på alla huvudsidor, inte gömd bakom en avatar. Svep vänster/höger på
// mobilen hoppar till nästa/föregående flik bland de primära (inte
// Mer-panelens innehåll — håller svepet förutsägbart), samma ordning som
// raden.
export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isEmployee, logout } = useBuddy();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const moreItems = useMemo(
    () => (isEmployee ? [...MORE_ITEMS, { href: "/internt", label: "Internt", icon: Shield }] : MORE_ITEMS),
    [isEmployee]
  );
  const moreActive = moreItems.some((item) => isActive(pathname, item.href));

  // mousedown-utanför istället för onBlur — onBlur visade sig stänga
  // panelen omedelbart efter att den öppnats i vissa webbläsare (klick på
  // en <button> ger den inte alltid fokus, t.ex. Safari på macOS som
  // standard), så själva öppningsklicket kunde trigga en omedelbar
  // stängning. mousedown-lyssnaren på hela dokumentet är oberoende av
  // fokus/blur-beteende och är samma mönster de flesta dropdown-menyer
  // använder.
  useEffect(() => {
    if (!moreOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [moreOpen]);

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

      const idx = NAV_ITEMS.findIndex((item) => isActive(pathname, item.href));
      if (idx === -1) return;
      const nextIdx = dx < 0 ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= NAV_ITEMS.length) return;
      router.push(NAV_ITEMS[nextIdx].href);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pathname, router]);

  const goToMore = (href: string) => {
    setMoreOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    setMoreOpen(false);
    logout();
    // Hard navigation med avsikt, samma som ProfilePage.tsx:s handleLogout —
    // undviker en kapplöpning mot den skyddade sidans egna redirect.
    window.location.href = "/";
  };

  return (
    <nav
      data-no-swipe-nav
      className="flex items-center gap-1 overflow-x-auto px-3 md:px-8 border-b border-line"
      style={{ background: "var(--color-frost-90)" }}
    >
      {NAV_ITEMS.map((item) => {
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
      <div className="relative flex-none" ref={moreRef}>
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 flex-none ${
            moreActive ? "border-forest text-forest" : "border-transparent text-slate hover:text-ink"
          }`}
        >
          <MoreHorizontal size={15} /> Mer
        </button>
        {moreOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-line shadow-lg overflow-hidden z-20 bd-fade">
            <div className="divide-y divide-line">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => goToMore(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-frost"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                      <Icon size={15} className="text-forest" />
                    </div>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-line hover:bg-frost text-sm font-medium text-slate"
            >
              <LogOut size={15} /> Logga ut
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
