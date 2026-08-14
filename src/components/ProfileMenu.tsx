"use client";

import { useRouter } from "next/navigation";
import { useBuddy } from "@/lib/buddy-context";

// Bara en avatar-genväg till /profil nu — själva navigeringen sköts av den
// stående flikraden (se TabBar.tsx) istället för en dropdown.
export function ProfileMenu() {
  const router = useRouter();
  const { profile } = useBuddy();
  const initial = profile?.name?.[0]?.toUpperCase() || "?";

  return (
    <button
      onClick={() => router.push("/profil")}
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold bd-display bg-forest flex-none"
      aria-label="Min profil"
    >
      {initial}
    </button>
  );
}
