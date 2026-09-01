"use client";

import { usePathname, useRouter } from "next/navigation";
import { useBuddy } from "@/lib/buddy-context";
import { HelperAvatar } from "./HelperAvatar";

// Sidorna där kund-appen faktiskt lever — allt annat (marknadssidor,
// /internt, /login) ska inte få companion-bubblan, även om en inloggad
// kund råkar bläddra dit (t.ex. klickar sig till startsidan). Ingen delad
// layout finns att hänga det här på (varje toppmapp i src/app bygger sin
// egen TopBar/TabBar), så en explicit lista är säkrare än att gissa på
// path-mönster.
const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/objekt",
  "/compare",
  "/onboarding",
  "/rekommendation",
  "/hushall",
  "/varva-en-van",
  "/mina-arenden",
  "/claim",
  "/book",
  "/halsokoll",
  "/arsrapport",
  "/arkiv",
  "/profil",
  "/installningar",
  "/anslut-bank",
  "/importera",
  "/identifiera-igen",
  "/livshandelser",
];

// Flytande, alltid synlig companion — bara på inloggade kundsidor, aldrig
// på /chat (att öppna chatten från chatten vore meningslöst) eller
// /internt (samma inloggade person kan vara både kund och anställd, t.ex.
// testkontot).
export function BuddyCompanion() {
  const pathname = usePathname();
  const router = useRouter();
  const { userType, loading } = useBuddy();

  if (loading || !userType) return null;
  if (!pathname || !APP_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <button
      onClick={() => router.push("/chat")}
      aria-label="Fråga Buddy"
      className="bd-btn fixed bottom-5 right-5 z-30 rounded-full shadow-lg bg-white border border-line p-1"
      style={{ boxShadow: "0 4px 20px rgba(51,70,92,.18)" }}
    >
      <HelperAvatar size={56} />
    </button>
  );
}
