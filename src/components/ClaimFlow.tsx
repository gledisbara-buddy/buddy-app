"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, CircleDot, Receipt, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { ConfirmDialog } from "@/components/Overlay";
import { TopBar } from "@/components/TopBar";
import { useBuddy } from "@/lib/buddy-context";
import { buildClassification, getIntakeReply, type Classification, type ChatMessage } from "@/lib/claim";
import { randomDelay } from "@/lib/chat";

type Phase = "chat" | "upload" | "submitting" | "confirmed";
type UploadedFile = { name: string; dataUrl: string };

export function ClaimFlow({ initialItemTitle }: { initialItemTitle?: string } = {}) {
  const router = useRouter();
  const { submitClaim, hasClaimPerk } = useBuddy();
  const [phase, setPhase] = useState<Phase>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: initialItemTitle
        ? `Hej. Tråkigt att höra att något har hänt med din ${initialItemTitle.toLowerCase()} — vad är det som har hänt?`
        : "Hej. Tråkigt att höra att något har hänt — vad är det som har hänt?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [receipts, setReceipts] = useState<UploadedFile[]>([]);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const exchanges = messages.filter((m) => m.role === "user").length;

  const handleBack = () => {
    if (exchanges > 0 && phase !== "confirmed") {
      setConfirmLeave(true);
      return;
    }
    router.push("/dashboard");
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const exchangeIndex = exchanges;
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: getIntakeReply(exchangeIndex) }]);
      setLoading(false);
    }, randomDelay(700, 1200));
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleFiles = (
    fileList: FileList | null,
    setter: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  ) => {
    if (!fileList) return;
    Array.from(fileList)
      .slice(0, 4)
      .forEach((file) => {
        const r = new FileReader();
        r.onload = () => setter((prev) => [...prev, { name: file.name, dataUrl: r.result as string }]);
        r.readAsDataURL(file);
      });
  };

  const classifyAndSubmit = () => {
    setPhase("submitting");
    setTimeout(() => {
      const result = buildClassification();
      setClassification(result);
      submitClaim({
        transcript: messages,
        photoCount: photos.length,
        receiptCount: receipts.length,
        skadetyp: result.skadetyp,
        allvarlighetsgrad: result.allvarlighetsgrad,
      });
      setPhase("confirmed");
    }, 1400);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <TopBar onBack={handleBack} right={<span className="bd-eyebrow">Skadeanmälan</span>} />

      {confirmLeave && (
        <ConfirmDialog
          title="Avbryta skadeanmälan?"
          body="Det du redan berättat sparas inte om du går tillbaka nu."
          confirmLabel="Avbryt anmälan"
          onConfirm={() => {
            setConfirmLeave(false);
            router.push("/dashboard");
          }}
          onCancel={() => setConfirmLeave(false)}
        />
      )}

      {phase === "chat" && (
        <>
          <div ref={scrollRef} className="bd-scroll flex-1 overflow-y-auto px-5 md:px-8 py-6">
            <div className="max-w-2xl mx-auto flex flex-col gap-4">
              {hasClaimPerk && (
                <div className="rounded-2xl p-4 flex items-start gap-3 bg-frost-2">
                  <ShieldCheck size={16} className="mt-0.5 flex-none text-forest" />
                  <p className="text-xs text-ink">
                    Du har kostnadsfri hjälp av en specialist vid skadereglering tack vare dina
                    värvningar!
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 bd-fade ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {m.role !== "user" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-none bg-forest">
                      <span className="text-white text-[11px] font-semibold bd-display">B</span>
                    </div>
                  )}
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
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-none bg-forest">
                    <span className="text-white text-[11px] font-semibold bd-display">B</span>
                  </div>
                  <div className="bg-white border border-line rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bd-dot bg-slate" />
                    <span className="w-1.5 h-1.5 rounded-full bd-dot bg-slate" />
                    <span className="w-1.5 h-1.5 rounded-full bd-dot bg-slate" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="px-5 md:px-8 pb-4 flex-none">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setPhase("upload")}
                className={`bd-btn w-full mb-3 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm ${
                  exchanges >= 2 ? "text-white bg-forest" : "text-forest bg-white border border-line"
                }`}
              >
                <Camera size={15} /> {exchanges >= 2 ? "Fortsätt till foton & kvitton" : "Hoppa till foton & kvitton"}
              </button>
              <div className="flex items-end gap-2 bg-white rounded-2xl border border-line p-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  rows={1}
                  placeholder="Berätta vad som hänt…"
                  className="flex-1 resize-none px-3 py-2.5 text-[14.5px] bg-transparent"
                  style={{ maxHeight: 120 }}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="bd-btn w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-forest disabled:opacity-40"
                >
                  <Send size={16} color="white" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {phase === "upload" && (
        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-8">
          <div className="max-w-lg mx-auto bd-fade">
            <span className="bd-eyebrow">Sista steget</span>
            <h1 className="bd-display text-2xl mt-3 mb-2">Ladda upp underlag</h1>
            <p className="text-sm mb-6 text-slate">
              Foto på skadan och ev. kvitton på det som drabbats.
            </p>
            <div className="flex flex-col gap-4 mb-8">
              {(
                [
                  { label: "Foto på skadan", icon: Camera, files: photos, setter: setPhotos },
                  { label: "Kvitton (valfritt)", icon: Receipt, files: receipts, setter: setReceipts },
                ] as const
              ).map((z) => (
                <div key={z.label}>
                  <label className="bd-dropzone cursor-pointer rounded-2xl border-2 border-dashed p-5 flex items-center gap-3 border-line">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                      <z.icon size={18} className="text-forest" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{z.label}</div>
                      <div className="text-xs text-slate">Klicka för att välja bilder</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => handleFiles(e.target.files, z.setter)}
                    />
                  </label>
                  {z.files.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {z.files.map((f, i) => (
                        <div
                          key={i}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-line"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                          <button
                            onClick={() => z.setter((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center"
                          >
                            <X size={10} color="white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={classifyAndSubmit}
              disabled={photos.length === 0}
              className="bd-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
            >
              Skicka in anmälan
            </button>
            {photos.length === 0 && (
              <p className="text-xs text-center mt-2 text-slate">Minst ett foto krävs.</p>
            )}
          </div>
        </div>
      )}

      {phase === "submitting" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-forest">
            <Send size={22} color="white" />
          </div>
          <div className="text-center">
            <div className="bd-display text-xl mb-1">Skickar in din anmälan…</div>
            <div className="text-sm text-slate">Buddy sammanställer det du berättat</div>
          </div>
        </div>
      )}

      {phase === "confirmed" && (
        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-8">
          <div className="max-w-lg mx-auto bd-fade">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-none bg-forest">
                <Check size={20} color="white" />
              </div>
              <div>
                <div className="font-semibold text-[15px]">Anmälan mottagen</div>
                <div className="text-xs text-slate">
                  {classification?.skadetyp} · Allvarlighetsgrad: {classification?.allvarlighetsgrad}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-line p-5 mb-6">
              <p className="text-sm text-ink">{classification?.sammanfattning}</p>
            </div>
            <div className="bg-white rounded-2xl border border-line p-6 mb-6">
              {(
                [
                  {
                    label: "Mottagen",
                    desc: "Din anmälan är registrerad hos Buddy",
                    done: true,
                    current: false,
                  },
                  {
                    label: "Under utredning",
                    desc: "En handläggare går igenom ärendet",
                    done: false,
                    current: true,
                  },
                  {
                    label: "Beslut",
                    desc: classification?.tidsuppskattning,
                    done: false,
                    current: false,
                  },
                ] satisfies { label: string; desc: string | undefined; done: boolean; current: boolean }[]
              ).map((s, i, arr) => (
                <div key={s.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-none ${s.current ? "bd-pulsedot" : ""}`}
                      style={{
                        background: s.done || s.current ? "var(--color-forest)" : "white",
                        border: s.done || s.current ? "none" : "2px solid var(--color-line)",
                      }}
                    >
                      {s.done ? (
                        <Check size={13} color="white" />
                      ) : s.current ? (
                        <CircleDot size={13} color="white" />
                      ) : null}
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        className="w-0.5 flex-1 my-1"
                        style={{ background: "var(--color-line)", minHeight: 34 }}
                      />
                    )}
                  </div>
                  <div className="pb-8">
                    <div className="text-sm font-semibold mb-0.5">{s.label}</div>
                    <div className="text-xs text-slate">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-5 flex items-start gap-3 bg-frost-2">
              <Sparkles size={16} className="mt-0.5 flex-none text-amber-deep" />
              <p className="text-xs text-ink">
                Du kan fråga Buddy om status när som helst, eller boka in ett samtal med en
                specialist.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
