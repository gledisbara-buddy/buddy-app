"use client";

import { useState } from "react";
import { useBuddy } from "@/lib/buddy-context";
import { getCannedReply, randomDelay, type ChatMessage } from "@/lib/chat";

// Delad mellan ChatScreen (helsida, /chat) och BuddyCompanion (popup) så
// de två aldrig kan råka ha olika svarslogik eller olika hälsningstext.
export function useBuddyChat() {
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

  return { messages, loading, send };
}
