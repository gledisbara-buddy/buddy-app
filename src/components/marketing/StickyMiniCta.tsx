"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { StartCta } from "@/components/marketing/StartCta";

// Osynlig vaktpost placerad direkt efter hero — när den skrollas ovanför
// vyn (inte bara "inte synlig", utan specifikt ovanför) visas en smal,
// alltid tillgänglig CTA-rad överst. Skiljer sig från MarketingNav (som
// inte är sticky) och påverkar bara sidan den faktiskt monteras på.
//
// Använder ett scroll-lyssnare istället för IntersectionObserver: en
// tröskelbaserad observer missar övergången vid stora/direkta scroll-hopp
// (t.ex. Home-tangenten eller ett draget scrollbar-handtag) eftersom
// vaktposten då aldrig hinner registreras som "intersecting" på vägen —
// den fastnar synlig. Ett scroll-event körs alltid, oavsett hopp-storlek.
export function StickyMiniCta() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const check = () => {
      ticking = false;
      const el = sentinelRef.current;
      if (!el) return;
      setVisible(el.getBoundingClientRect().top < 0);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Körs som ett rAF-callback (asynkront), inte synkront i effekt-kroppen
    // — täcker fallet att sidan laddas redan nedskrollad (t.ex. tillbaka-
    // navigering), utan att sätta state direkt i effektens body.
    const raf = requestAnimationFrame(check);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div
        className={`fixed top-0 inset-x-0 z-50 border-b border-line transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
        style={{ background: "var(--color-frost-90)", backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-3 flex items-center justify-between gap-4">
          <Logo />
          <StartCta className="bd-btn px-5 py-2.5 rounded-full font-semibold text-white text-sm bg-forest flex items-center gap-2" />
        </div>
      </div>
    </>
  );
}
