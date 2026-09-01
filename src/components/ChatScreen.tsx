"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Send } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { HelperAvatar } from "@/components/HelperAvatar";
import { useBuddy } from "@/lib/buddy-context";
import { CHAT_SUGGESTIONS } from "@/lib/chat";
import { useBuddyChat } from "@/lib/use-buddy-chat";

export function ChatScreen() {
  const router = useRouter();
  const { userType, loading: authLoading } = useBuddy();

  useEffect(() => {
    if (!authLoading && !userType) router.replace("/kom-igang");
  }, [authLoading, userType, router]);

  const { messages, loading, send } = useBuddyChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (authLoading || !userType) return null;

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
    <div className="h-screen w-full flex flex-col">
      <TopBar
        onBack={() => router.push("/dashboard")}
        right={
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-frost-2 text-forest whitespace-nowrap">
              Demo-läge
            </span>
            <button
              onClick={() => router.push("/book")}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full text-white bg-forest"
            >
              <CalendarDays size={13} /> Boka specialist
            </button>
          </div>
        }
      />
      <div ref={scrollRef} className="bd-scroll flex-1 overflow-y-auto px-5 md:px-8 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 bd-fade ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {m.role !== "user" && <HelperAvatar size={28} />}
              <div
                className="max-w-[78%] px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap"
                style={{
                  background: m.role === "user" ? "var(--color-forest)" : "white",
                  color: m.role === "user" ? "white" : "var(--color-ink)",
                  border: m.role === "user" ? "none" : "1px solid var(--color-line)",
                  borderRadius: 16,
                  borderBottomRightRadius: m.role === "user" ? 4 : 16,
                  borderBottomLeftRadius: m.role === "user" ? 16 : 4,
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-end gap-2 bd-fade">
              <HelperAvatar size={28} />
              <div className="bg-white border border-line rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bd-dot bg-slate" />
                <span className="w-1.5 h-1.5 rounded-full bd-dot bg-slate" />
                <span className="w-1.5 h-1.5 rounded-full bd-dot bg-slate" />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="px-5 md:px-8 pb-3 flex-none">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto pb-3">
          {CHAT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              disabled={loading}
              className="whitespace-nowrap text-xs px-3.5 py-2 rounded-full border border-line bg-white flex-none disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 md:px-8 pb-6 flex-none">
        <div className="max-w-2xl mx-auto flex items-end gap-2 bg-white rounded-2xl border border-line p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Skriv din fråga till Buddy…"
            className="flex-1 resize-none px-3 py-2.5 text-[14.5px] bg-transparent"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={() => submit()}
            disabled={loading || !input.trim()}
            className="bd-btn w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-forest disabled:opacity-40"
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
