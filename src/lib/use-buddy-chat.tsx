"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useBuddy } from "@/lib/buddy-context";
import { getCannedReply, randomDelay, type ChatMessage } from "@/lib/chat";

type BuddyChatValue = {
  messages: ChatMessage[];
  loading: boolean;
  send: (text: string) => void;
};

const BuddyChatContext = createContext<BuddyChatValue | null>(null);

// Delad kontext (inte lokal state) mellan ChatScreen (helsida, /chat) och
// BuddyCompanion (popup) — så "öppna i helskärm" fortsätter samma samtal
// istället för att tappa allt kunden redan skrivit i popupen.
export function BuddyChatProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading, profile } = useBuddy();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: `Hej ${profile?.name || "där"}. Vad kan jag hjälpa dig med?` },
  ]);
  const [loading, setLoading] = useState(false);
  const [syncedAuthLoading, setSyncedAuthLoading] = useState(authLoading);

  // profile laddas asynkront — hälsningen (satt vid mount) hinner ibland
  // före, så den uppdateras en gång när laddningen är klar. Justeras under
  // rendering (samma mönster som NeedsAnalysis.tsx), inte i en effekt.
  if (authLoading !== syncedAuthLoading) {
    setSyncedAuthLoading(authLoading);
    if (!authLoading) {
      setMessages((prev) =>
        prev.length === 1 && prev[0].role === "assistant"
          ? [{ role: "assistant", content: `Hej ${profile?.name || "där"}. Vad kan jag hjälpa dig med?` }]
          : prev
      );
    }
  }

  const send = (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setMessages((prev) => [...prev, { role: "user", content }]);
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: getCannedReply(content) }]);
      setLoading(false);
    }, randomDelay(700, 1200));
  };

  return <BuddyChatContext.Provider value={{ messages, loading, send }}>{children}</BuddyChatContext.Provider>;
}

export function useBuddyChat() {
  const ctx = useContext(BuddyChatContext);
  if (!ctx) throw new Error("useBuddyChat must be used within BuddyChatProvider");
  return ctx;
}
