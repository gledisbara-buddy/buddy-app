"use client";

import { useEffect, useState } from "react";
import Buddy, { type BuddyEmotion } from "@/components/Buddy";

const TRANSITION_MS = 250;
// BUDDY-SPEC.md, regel 5: "raknar" ska inte snurra i evighet — efter ~8s
// utan svar går Buddy till "beklagar" med en förklarande text istället.
const RAKNAR_TIMEOUT_MS = 8000;

// Enkel opacity-övergång mellan humör (200–300ms), ingen morphing mellan
// formerna — varje humörbyte remountar bara den inre SVG:n och låter en
// CSS-keyframe-animation (fade-in) spela, se BUDDY-SPEC.md regel 3.
export function BuddyStage({
  emotion,
  size = 120,
  title,
  className = "",
  timeoutMessage,
}: {
  emotion: BuddyEmotion;
  size?: number;
  title?: string;
  className?: string;
  // Visas under avataren om "raknar" tar för lång tid och Buddy går till
  // "beklagar" av sig själv — se timedOut nedan.
  timeoutMessage?: string;
}) {
  const [shown, setShown] = useState(emotion);
  const [fadeKey, setFadeKey] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  // Nollställer timedOut när flödet lämnar "raknar" — justerat under
  // rendering (samma mönster som Onboarding.tsx:s addModeFor), inte i en
  // effekt, för att undvika en extra cascading render.
  const [lastEmotion, setLastEmotion] = useState(emotion);
  if (emotion !== lastEmotion) {
    setLastEmotion(emotion);
    if (emotion !== "raknar") setTimedOut(false);
  }

  // Legitim effekt: prenumererar på en extern timer, inte bara
  // synkroniserar härledd state.
  useEffect(() => {
    if (emotion !== "raknar") return;
    const t = setTimeout(() => setTimedOut(true), RAKNAR_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [emotion]);

  const effective = timedOut ? "beklagar" : emotion;
  if (effective !== shown) {
    setShown(effective);
    setFadeKey((k) => k + 1);
  }

  return (
    <div className={className}>
      <div key={fadeKey} style={{ width: size, height: size, animation: `buddy-stage-fade ${TRANSITION_MS}ms ease` }}>
        <Buddy emotion={shown} size={size} title={title} />
      </div>
      {timedOut && timeoutMessage && <p className="text-sm mt-2 text-slate">{timeoutMessage}</p>}
      <style>{`@keyframes buddy-stage-fade{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}
