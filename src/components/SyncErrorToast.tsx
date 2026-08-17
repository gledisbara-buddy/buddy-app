"use client";

import { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { useBuddy } from "@/lib/buddy-context";

// Monterad en gång i BuddyProvider (buddy-context.tsx) så den syns oavsett
// vilken sida kunden är på — de flesta skrivningar i buddy-context är
// optimistiska (UI:t uppdateras direkt, innan svaret från Supabase kommit
// tillbaka), så utan den här toasten syns ett misslyckat sparande ingenstans.
export function SyncErrorToast() {
  const { syncError, dismissSyncError } = useBuddy();

  useEffect(() => {
    if (!syncError) return;
    const timer = setTimeout(dismissSyncError, 6000);
    return () => clearTimeout(timer);
  }, [syncError, dismissSyncError]);

  if (!syncError) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pointer-events-none">
      <div
        role="alert"
        className="bd-fade pointer-events-auto w-full max-w-sm bg-white rounded-2xl border border-line shadow-lg p-4 flex items-start gap-3"
      >
        <AlertCircle size={18} className="text-red-600 flex-none mt-0.5" />
        <p className="text-sm text-ink flex-1">{syncError}</p>
        <button onClick={dismissSyncError} aria-label="Stäng felmeddelandet" className="flex-none opacity-50 hover:opacity-100">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
