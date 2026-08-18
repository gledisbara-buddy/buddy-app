"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Tonar in + glider upp en sektion när den skrollas in i vyn, en gång.
// Hoppar över animationen helt om användaren begärt reducerad rörelse
// (prefers-reduced-motion) — sektionen visas då direkt utan fördröjning.
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Lazy initializer (körs vid render, inte i en effekt) — undviker en
  // synkron setState i effekten för fallet med reducerad rörelse.
  const [shown, setShown] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}
