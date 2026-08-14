"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Gift, HelpCircle, Home, Inbox, LayoutDashboard, LogOut, Settings, Shield, User } from "lucide-react";
import { useBuddy } from "@/lib/buddy-context";

export function ProfileMenu() {
  const router = useRouter();
  const { profile, isEmployee, logout } = useBuddy();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    // Hard navigation on purpose: a client-side router.push here would race
    // the guarded page's own "not logged in" redirect effect (which fires
    // right after logout() clears userType) and can lose to it.
    window.location.href = "/";
  };

  const initial = profile?.name?.[0]?.toUpperCase() || "?";

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold bd-display bg-forest"
        aria-label="Profilmeny"
      >
        {initial}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-line shadow-lg overflow-hidden z-20 bd-fade"
        >
          <div className="px-4 py-3.5 border-b border-line">
            <div className="font-semibold text-[15px]">{profile?.name || "Din profil"}</div>
            {profile?.email && <div className="text-xs text-slate">{profile.email}</div>}
          </div>
          <div className="py-1.5">
            <button
              onClick={() => go("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left"
            >
              <LayoutDashboard size={16} className="text-forest" /> Min översikt
            </button>
            <button
              onClick={() => go("/profil")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left"
            >
              <User size={16} className="text-forest" /> Min profil
            </button>
            <button
              onClick={() => go("/mina-arenden")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left"
            >
              <Inbox size={16} className="text-forest" /> Mina ärenden
            </button>
            <button
              onClick={() => go("/varva-en-van")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left"
            >
              <Gift size={16} className="text-forest" /> Värva en vän
            </button>
            <button
              onClick={() => go("/hushall")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left"
            >
              <Home size={16} className="text-forest" /> Hushåll
            </button>
            <button
              onClick={() => go("/arkiv")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left"
            >
              <FolderOpen size={16} className="text-forest" /> Dokumentarkiv
            </button>
            <button
              onClick={() => go("/installningar")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left"
            >
              <Settings size={16} className="text-forest" /> Inställningar
            </button>
            <button
              onClick={() => go("/vanliga-fragor")}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left"
            >
              <HelpCircle size={16} className="text-forest" /> Hjälp & Support
            </button>
          </div>
          {isEmployee && (
            <div className="py-1.5 border-t border-line">
              <button
                onClick={() => go("/internt")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left"
              >
                <Shield size={16} className="text-forest" /> Internt
              </button>
            </div>
          )}
          <div className="py-1.5 border-t border-line">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-frost text-left text-slate"
            >
              <LogOut size={16} /> Logga ut
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
