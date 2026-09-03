"use client";

import { useBuddy } from "@/lib/buddy-context";

// Samma villkor som StartCta.tsx redan använder för knappen precis under —
// annars pratar brödtexten om att "skapa ett konto" till en inloggad
// besökare vars egen profilbild redan syns i menyn ovanför.
export function HeroDek({ className }: { className?: string }) {
  const { userType } = useBuddy();

  return (
    <p className={className}>
      {userType
        ? "Bra att se dig igen. Fortsätt där du var — jämför fler av dina saker, eller se vad som hänt sen sist."
        : "Skapa ett konto och hämta in allt med BankID på under en minut. Jämför, säg upp det gamla och få hjälp direkt om något händer — allt på ett ställe."}
    </p>
  );
}
