"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarPlus, Check, Clock, Phone, Video } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ProgressDots } from "@/components/ProgressDots";
import { MONTHS, nextWeekdays, TIME_SLOTS, WEEKDAYS } from "@/lib/booking";

type MeetingType = "video" | "phone";

export function BookSpecialist() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const days = useMemo(() => nextWeekdays(6), []);
  const day = days[dayIdx];

  const fmtDay = (d: Date) => `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const fmtDayFull = (d: Date) => `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  const goBack = () => {
    if (step === 0) {
      router.push("/dashboard");
      return;
    }
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      {step < 3 && (
        <div className="w-full flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="opacity-60 hover:opacity-100">
              <ArrowLeft size={18} />
            </button>
            <Logo />
          </div>
          <ProgressDots total={3} current={step} />
          <div className="w-6" />
        </div>
      )}
      <div className="flex-1 flex items-start justify-center px-5 pt-6 pb-16">
        <div className="w-full max-w-md bd-fade" key={step}>
          {step === 0 && (
            <>
              <span className="bd-eyebrow">Boka specialist</span>
              <h1 className="bd-display text-2xl md:text-3xl mt-3 mb-2">Hur vill du prata?</h1>
              <p className="text-sm mb-6 text-slate">Samma rådgivare oavsett.</p>
              <div className="flex flex-col gap-3">
                {(
                  [
                    { id: "video", label: "Videosamtal", desc: "Direkt i appen", icon: Video },
                    { id: "phone", label: "Telefon", desc: "Vi ringer upp dig", icon: Phone },
                  ] as const
                ).map((o) => {
                  const active = meetingType === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setMeetingType(o.id)}
                      className="bd-card w-full text-left p-5 rounded-2xl border flex items-center gap-4"
                      style={{
                        borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                        background: active ? "var(--color-frost-2)" : "white",
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
                        style={{ background: active ? "var(--color-forest)" : "var(--color-frost)" }}
                      >
                        <o.icon size={19} color={active ? "white" : "var(--color-forest)"} />
                      </div>
                      <div>
                        <div className="font-semibold text-[15px]">{o.label}</div>
                        <div className="text-sm text-slate">{o.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!meetingType}
                className="bd-btn w-full mt-7 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
              >
                Fortsätt
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <span className="bd-eyebrow">Boka specialist</span>
              <h1 className="bd-display text-2xl md:text-3xl mt-3 mb-2">Välj dag och tid</h1>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
                {days.map((d, i) => {
                  const active = i === dayIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setDayIdx(i);
                        setTime(null);
                      }}
                      className="flex-none px-4 py-3 rounded-xl border text-center"
                      style={{
                        borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                        background: active ? "var(--color-forest)" : "white",
                        minWidth: 76,
                      }}
                    >
                      <div
                        className="text-[11px] font-medium"
                        style={{ color: active ? "rgba(255,255,255,.7)" : "var(--color-slate)" }}
                      >
                        {WEEKDAYS[d.getDay()].slice(0, 3)}
                      </div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: active ? "white" : "var(--color-ink)" }}
                      >
                        {d.getDate()} {MONTHS[d.getMonth()]}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-2.5 mb-2">
                {TIME_SLOTS.map((t) => {
                  const active = time === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className="bd-card flex items-center justify-center gap-1.5 py-3 rounded-xl border text-sm font-medium"
                      style={{
                        borderColor: active ? "var(--color-forest)" : "var(--color-line)",
                        background: active ? "var(--color-forest)" : "white",
                        color: active ? "white" : "var(--color-ink)",
                      }}
                    >
                      <Clock size={13} /> {t}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!time}
                className="bd-btn w-full mt-6 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
              >
                Fortsätt
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <span className="bd-eyebrow">Boka specialist</span>
              <h1 className="bd-display text-2xl md:text-3xl mt-3 mb-2">Bekräfta din bokning</h1>
              <div className="bg-white rounded-2xl border border-line p-5 mb-5">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-line">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                    {meetingType === "video" ? (
                      <Video size={17} className="text-forest" />
                    ) : (
                      <Phone size={17} className="text-forest" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {meetingType === "video" ? "Videosamtal" : "Telefonsamtal"}
                    </div>
                    <div className="text-xs text-slate">Med en rådgivare från Buddy</div>
                  </div>
                </div>
                <div className="text-sm font-semibold mb-1">{fmtDayFull(day)}</div>
                <div className="text-sm text-slate">Kl. {time} · ca 20 minuter</div>
              </div>
              <label className="text-sm font-medium mb-2 block">
                {meetingType === "phone" ? "Telefonnummer" : "E-post för videolänk"}
              </label>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={meetingType === "phone" ? "070-123 45 67" : "sam@exempel.se"}
                className="w-full px-4 py-3 rounded-xl border border-line text-[15px] mb-6"
              />
              <button
                onClick={() => setStep(3)}
                disabled={contact.trim().length < 3}
                className="bd-btn w-full py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest disabled:opacity-40"
              >
                Bekräfta bokning
              </button>
            </>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-forest">
                <Check size={28} color="white" />
              </div>
              <h1 className="bd-display text-2xl mb-2">Din tid är bokad</h1>
              <p className="text-sm mb-6 text-slate">
                Vi hörs {fmtDay(day).toLowerCase()} kl. {time}.
              </p>
              <div className="bg-white rounded-2xl border border-line p-5 mb-6 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-frost-2">
                    {meetingType === "video" ? (
                      <Video size={16} className="text-forest" />
                    ) : (
                      <Phone size={16} className="text-forest" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {meetingType === "video" ? "Videosamtal" : "Telefonsamtal"}
                    </div>
                    <div className="text-xs text-slate">
                      {fmtDayFull(day)} · {time}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate">Bekräftelse skickad till {contact}</div>
              </div>
              <button className="bd-btn w-full mb-3 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest">
                <CalendarPlus size={16} /> Lägg till i kalender
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm font-semibold text-forest"
              >
                Tillbaka till översikten
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
