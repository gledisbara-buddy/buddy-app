"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Maximize2, Send, X } from "lucide-react";
import Buddy from "./Buddy";
import { CHAT_SUGGESTIONS } from "@/lib/chat";
import { useBuddyChat } from "@/lib/use-buddy-chat";

// Synlig överallt — marknadssidor, inloggat, jämförelseflödet, allt. Två
// undantag: /internt (anställdvy, ett helt annat sammanhang än
// kundresan även för konton som är bådadera) och /chat (redan där, en
// flytande genväg till samma sak vore bara brus).
function useCompanionVisible() {
  const pathname = usePathname();
  if (pathname?.startsWith("/internt")) return false;
  if (pathname?.startsWith("/chat")) return false;
  return true;
}

function ChatPopup({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { messages, loading, send } = useBuddyChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const submit = (text?: string) => {
    const content = text ?? input;
    send(content);
    if (content.trim()) setInput("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="bd-fade fixed bottom-24 right-5 z-30 w-[calc(100vw-2.5rem)] max-w-[380px] h-[min(560px,calc(100vh-9rem))] flex flex-col bg-white rounded-2xl border border-line shadow-lg overflow-hidden"
      style={{ boxShadow: "0 8px 32px rgba(51,70,92,.22)" }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line flex-none">
        <Buddy emotion="halsar" size={30} />
        <span className="text-sm font-semibold flex-1">Buddy</span>
        <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-frost-2 text-forest whitespace-nowrap">
          Demo-läge
        </span>
        <button
          onClick={() => router.push("/chat")}
          aria-label="Öppna i helskärm"
          className="opacity-60 hover:opacity-100 flex-none"
        >
          <Maximize2 size={15} />
        </button>
        <button onClick={onClose} aria-label="Stäng chatten" className="opacity-60 hover:opacity-100 flex-none">
          <X size={17} />
        </button>
      </div>

      <div ref={scrollRef} className="bd-scroll flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 bd-fade ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role !== "user" && <Buddy emotion="halsar" size={24} />}
            <div
              className="max-w-[80%] px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap"
              style={{
                background: m.role === "user" ? "var(--color-forest)" : "var(--color-frost)",
                color: m.role === "user" ? "white" : "var(--color-ink)",
                borderRadius: 14,
                borderBottomRightRadius: m.role === "user" ? 3 : 14,
                borderBottomLeftRadius: m.role === "user" ? 14 : 3,
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2 bd-fade">
            <Buddy emotion="halsar" size={24} />
            <div className="bg-frost rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bd-dot bg-slate" />
              <span className="w-1.5 h-1.5 rounded-full bd-dot bg-slate" />
              <span className="w-1.5 h-1.5 rounded-full bd-dot bg-slate" />
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pt-1 flex-none">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {CHAT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              disabled={loading}
              className="whitespace-nowrap text-[11px] px-3 py-1.5 rounded-full border border-line bg-white flex-none disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3 pt-0 flex-none">
        <div className="flex items-end gap-1.5 bg-frost rounded-xl border border-line p-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Skriv din fråga till Buddy…"
            className="flex-1 resize-none px-2 py-1.5 text-[13.5px] bg-transparent"
            style={{ maxHeight: 80 }}
          />
          <button
            onClick={() => submit()}
            disabled={loading || !input.trim()}
            className="bd-btn w-8 h-8 rounded-lg flex items-center justify-center flex-none bg-forest disabled:opacity-40"
          >
            <Send size={14} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function BuddyCompanion() {
  const visible = useCompanionVisible();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Stängs av path-byte (annars kan popupen bli kvar öppen medan man
  // navigerar vidare i bakgrunden, vilket ser ut som en bugg). Justeras
  // under rendering (samma mönster som Onboarding.tsx:s addModeFor),
  // inte i en effekt — undviker en extra cascading render.
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!visible) return null;

  return (
    <div ref={wrapRef}>
      {open && <ChatPopup onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Stäng Buddy" : "Fråga Buddy"}
        className="bd-btn fixed bottom-5 right-5 z-30 rounded-full shadow-lg bg-white border border-line p-1"
        style={{ boxShadow: "0 4px 20px rgba(51,70,92,.18)" }}
      >
        {open ? (
          <div className="w-14 h-14 flex items-center justify-center">
            <X size={22} className="text-slate" />
          </div>
        ) : (
          <Buddy emotion="vilar" size={56} />
        )}
      </button>
    </div>
  );
}
