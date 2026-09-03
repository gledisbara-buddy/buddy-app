"use client";

import { useEffect, useMemo, useState } from "react";
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
  X,
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

  const moreItems = useMemo(
    () => (isEmployee ? [...MORE_ITEMS, { href: "/internt", label: "Internt", icon: Shield }] : MORE_ITEMS),
    [isEmployee]
  );
  const moreActive = moreItems.some((item) => isActive(pathname, item.href));

  // Riktig sidopanel (som Folksams "Mer"), inte en liten nedfälld meny —
  // fast positionerad med en mörk bakgrund bakom, så stängs den via
  // bakgrunden/X-knappen/Escape istället för klick-utanför-detektering.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
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
      // justify-start (inte justify-center) på mobilen — annars centrerar
      // flexboxen innehållet symmetriskt över hela raden, vilket klipper
      // bort BÖRJAN av den skrollbara raden redan innan man rört vid den
      // (scrollLeft börjar på 0, men det som visas där är inte radens
      // faktiska start). Skärmen är bred nog för att rymma allt från
      // md och uppåt, så centrering är bara ett problem när raden faktiskt
      // överflödar.
      className="flex items-center justify-start md:justify-center gap-1 overflow-x-auto px-3 md:px-8 border-b border-line"
      style={{ background: "var(--color-frost-90)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex items-center gap-2 px-4 py-3 text-base font-medium whitespace-nowrap border-b-2 flex-none ${
              active ? "border-forest text-forest" : "border-transparent text-slate hover:text-ink"
            }`}
          >
            <Icon size={17} /> {item.label}
          </button>
        );
      })}
      <button
        onClick={() => setMoreOpen(true)}
        className={`flex items-center gap-2 px-4 py-3 text-base font-medium whitespace-nowrap border-b-2 flex-none ${
          moreActive ? "border-forest text-forest" : "border-transparent text-slate hover:text-ink"
        }`}
      >
        <MoreHorizontal size={17} /> Mer
      </button>

      {moreOpen && (
        <>
          <div
            className="bd-scrim fixed inset-0 z-40"
            style={{ background: "var(--color-scrim)" }}
            onClick={() => setMoreOpen(false)}
          />
          <div className="bd-slide-in-right fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-line flex-none">
              <span className="font-semibold text-[15px]">Mer</span>
              <button onClick={() => setMoreOpen(false)} className="opacity-60 hover:opacity-100" aria-label="Stäng">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-line">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => goToMore(item.href)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-frost"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                      <Icon size={16} className="text-forest" />
                    </div>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex-none border-t border-line p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-line text-sm font-medium text-slate hover:text-ink"
              >
                <LogOut size={15} /> Logga ut
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
