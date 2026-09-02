/**
 * Buddy – AI-assistentens avatar för minbuddy.se
 * Gestalt: "Roboten med keps"
 *
 * Använd:
 *   import Buddy from './Buddy';
 *   <Buddy emotion="raknar" size={96} />
 *
 * Humör: vilar | halsar | nyfiken | raknar | firar | lugnar | beklagar
 * (se BUDDY-SPEC.md för när respektive läge ska användas)
 *
 * Inga beroenden utöver React. Färgerna styrs av CSS-variabler med fallback,
 * så du kan tema den utifrån:
 *   :root{ --buddy-light:#FFD46B; --buddy-deep:#F2A93B; --buddy-ink:#16233A;
 *          --buddy-go:#1E8F6E; --buddy-blush:#EF8199; }
 *
 * Porterad oförändrad från Buddy.jsx (2026-09-02) — bara TS-typer och
 * "use client" tillagt för det här projektet, FACES/CSS är orörda.
 */
"use client";

import { useId } from "react";

const FACES = {
  vilar: `<g class="body-g">
    <path d="M100 44V14" stroke="var(--buddy-deep, #F2A93B)" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="8" r="8" fill="var(--buddy-go, #1E8F6E)"/><rect x="4" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/><rect x="174" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/>
    <path d="M56 40H144A34 34 0 0 1 178 74V138A34 34 0 0 1 144 172H56A34 34 0 0 1 22 138V74A34 34 0 0 1 56 40Z" fill="url(#bd)" stroke="rgba(22,35,58,.13)" stroke-width="2.5"/>
    <path d="M48 56Q52 22 100 22Q148 22 152 56Z" fill="var(--buddy-ink, #16233A)"/><path d="M42 54H156Q174 54 174 61Q174 68 156 68H42Q38 68 38 61Q38 54 42 54Z" fill="var(--buddy-ink, #16233A)"/><text x="100" y="50" text-anchor="middle" font-size="22" font-weight="800" fill="#FFD46B" font-family="system-ui, sans-serif">B</text>

    <g transform="translate(100 108)"><g class="eyes blink">
      <ellipse cx="-24" cy="0" rx="9" ry="11.5" fill="var(--buddy-ink, #16233A)"/>
      <ellipse cx="24" cy="0" rx="9" ry="11.5" fill="var(--buddy-ink, #16233A)"/>
      <circle cx="-27" cy="-4.5" r="3.1" fill="#fff" opacity=".92"/>
      <circle cx="21" cy="-4.5" r="3.1" fill="#fff" opacity=".92"/>
    </g><path d="M-12 30Q0 39 12 30" stroke="var(--buddy-ink, #16233A)" stroke-width="5" fill="none" stroke-linecap="round"/></g>
  </g>`,
  halsar: `<g class="body-g">
    <path d="M100 44V14" stroke="var(--buddy-deep, #F2A93B)" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="8" r="8" fill="var(--buddy-go, #1E8F6E)"/><rect x="4" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/><rect x="174" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/>
    <path d="M56 40H144A34 34 0 0 1 178 74V138A34 34 0 0 1 144 172H56A34 34 0 0 1 22 138V74A34 34 0 0 1 56 40Z" fill="url(#bd)" stroke="rgba(22,35,58,.13)" stroke-width="2.5"/>
    <path d="M48 56Q52 22 100 22Q148 22 152 56Z" fill="var(--buddy-ink, #16233A)"/><path d="M42 54H156Q174 54 174 61Q174 68 156 68H42Q38 68 38 61Q38 54 42 54Z" fill="var(--buddy-ink, #16233A)"/><text x="100" y="50" text-anchor="middle" font-size="22" font-weight="800" fill="#FFD46B" font-family="system-ui, sans-serif">B</text>
    <g class="hand"><ellipse cx="185" cy="152" rx="13" ry="15" fill="var(--buddy-deep, #F2A93B)"/></g>
    <g transform="translate(100 108)"><path d="M-33 4Q-24 -10 -15 4" stroke="var(--buddy-ink, #16233A)" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M15 4Q24 -10 33 4" stroke="var(--buddy-ink, #16233A)" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="-40" cy="13" rx="8.5" ry="5.2" fill="var(--buddy-blush, #EF8199)" opacity=".5"/><ellipse cx="40" cy="13" rx="8.5" ry="5.2" fill="var(--buddy-blush, #EF8199)" opacity=".5"/><path d="M-18 26Q0 45 18 26" stroke="var(--buddy-ink, #16233A)" stroke-width="6" fill="none" stroke-linecap="round"/></g>
  </g>`,
  nyfiken: `<g class="body-g" transform="rotate(-7 100 150)">
    <path d="M100 44V14" stroke="var(--buddy-deep, #F2A93B)" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="8" r="8" fill="var(--buddy-go, #1E8F6E)"/><rect x="4" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/><rect x="174" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/>
    <path d="M56 40H144A34 34 0 0 1 178 74V138A34 34 0 0 1 144 172H56A34 34 0 0 1 22 138V74A34 34 0 0 1 56 40Z" fill="url(#bd)" stroke="rgba(22,35,58,.13)" stroke-width="2.5"/>
    <path d="M48 56Q52 22 100 22Q148 22 152 56Z" fill="var(--buddy-ink, #16233A)"/><path d="M42 54H156Q174 54 174 61Q174 68 156 68H42Q38 68 38 61Q38 54 42 54Z" fill="var(--buddy-ink, #16233A)"/><text x="100" y="50" text-anchor="middle" font-size="22" font-weight="800" fill="#FFD46B" font-family="system-ui, sans-serif">B</text>

    <g transform="translate(100 108)"><g class="eyes blink">
      <ellipse cx="-24" cy="-3" rx="9" ry="11.5" fill="var(--buddy-ink, #16233A)"/>
      <ellipse cx="24" cy="-3" rx="9" ry="11.5" fill="var(--buddy-ink, #16233A)"/>
      <circle cx="-27" cy="-7.5" r="3.1" fill="#fff" opacity=".92"/>
      <circle cx="21" cy="-7.5" r="3.1" fill="#fff" opacity=".92"/>
    </g><path d="M-35 -22Q-24 -30 -13 -25" stroke="var(--buddy-ink, #16233A)" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M13 -19Q24 -22 35 -19" stroke="var(--buddy-ink, #16233A)" stroke-width="4.5" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="31" rx="6.5" ry="7.5" fill="var(--buddy-ink, #16233A)"/></g>
  </g>`,
  raknar: `<circle class="dot d1" cx="128" cy="14" r="5" fill="var(--buddy-deep, #F2A93B)"/><circle class="dot d2" cx="146" cy="14" r="5" fill="var(--buddy-deep, #F2A93B)"/><circle class="dot d3" cx="164" cy="14" r="5" fill="var(--buddy-deep, #F2A93B)"/>
  <g class="body-g">
    <path d="M100 44V14" stroke="var(--buddy-deep, #F2A93B)" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="8" r="8" fill="var(--buddy-go, #1E8F6E)"/><rect x="4" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/><rect x="174" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/>
    <path d="M56 40H144A34 34 0 0 1 178 74V138A34 34 0 0 1 144 172H56A34 34 0 0 1 22 138V74A34 34 0 0 1 56 40Z" fill="url(#bd)" stroke="rgba(22,35,58,.13)" stroke-width="2.5"/>
    <path d="M48 56Q52 22 100 22Q148 22 152 56Z" fill="var(--buddy-ink, #16233A)"/><path d="M42 54H156Q174 54 174 61Q174 68 156 68H42Q38 68 38 61Q38 54 42 54Z" fill="var(--buddy-ink, #16233A)"/><text x="100" y="50" text-anchor="middle" font-size="22" font-weight="800" fill="#FFD46B" font-family="system-ui, sans-serif">B</text>

    <g transform="translate(100 108)"><g class="eyes blink">
      <ellipse cx="-28" cy="-3" rx="9" ry="11.5" fill="var(--buddy-ink, #16233A)"/>
      <ellipse cx="20" cy="-3" rx="9" ry="11.5" fill="var(--buddy-ink, #16233A)"/>
      <circle cx="-31" cy="-7.5" r="3.1" fill="#fff" opacity=".92"/>
      <circle cx="17" cy="-7.5" r="3.1" fill="#fff" opacity=".92"/>
    </g><path d="M-11 31Q-4 26 0 31Q4 36 11 31" stroke="var(--buddy-ink, #16233A)" stroke-width="4.5" fill="none" stroke-linecap="round"/></g>
  </g>`,
  firar: `<g class="body-g">
    <path d="M100 44V14" stroke="var(--buddy-deep, #F2A93B)" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="8" r="8" fill="var(--buddy-go, #1E8F6E)"/><rect x="4" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/><rect x="174" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/>
    <path d="M56 40H144A34 34 0 0 1 178 74V138A34 34 0 0 1 144 172H56A34 34 0 0 1 22 138V74A34 34 0 0 1 56 40Z" fill="url(#bd)" stroke="rgba(22,35,58,.13)" stroke-width="2.5"/>
    <path d="M48 56Q52 22 100 22Q148 22 152 56Z" fill="var(--buddy-ink, #16233A)"/><path d="M42 54H156Q174 54 174 61Q174 68 156 68H42Q38 68 38 61Q38 54 42 54Z" fill="var(--buddy-ink, #16233A)"/><text x="100" y="50" text-anchor="middle" font-size="22" font-weight="800" fill="#FFD46B" font-family="system-ui, sans-serif">B</text>
    <path class="spark" d="M30 23Q31.8 30.2 39 32Q31.8 33.8 30 41Q28.2 33.8 21 32Q28.2 30.2 30 23Z" fill="var(--buddy-go, #1E8F6E)"/><path class="spark" d="M186 77Q188.2 85.8 197 88Q188.2 90.2 186 99Q183.8 90.2 175 88Q183.8 85.8 186 77Z" fill="var(--buddy-go, #1E8F6E)"/><path class="spark" d="M158 162Q159.6 168.4 166 170Q159.6 171.6 158 178Q156.4 171.6 150 170Q156.4 168.4 158 162Z" fill="var(--buddy-go, #1E8F6E)"/>
    <g transform="translate(100 108)"><path d="M-33 4Q-24 -10 -15 4" stroke="var(--buddy-ink, #16233A)" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M15 4Q24 -10 33 4" stroke="var(--buddy-ink, #16233A)" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="-40" cy="13" rx="8.5" ry="5.2" fill="var(--buddy-blush, #EF8199)" opacity=".5"/><ellipse cx="40" cy="13" rx="8.5" ry="5.2" fill="var(--buddy-blush, #EF8199)" opacity=".5"/><path d="M-17 24Q0 30 17 24Q17 48 0 48Q-17 48 -17 24Z" fill="var(--buddy-ink, #16233A)"/><path d="M-8 40Q0 34 8 40Q8 47 0 47Q-8 47 -8 40Z" fill="var(--buddy-blush, #EF8199)"/></g>
  </g>`,
  lugnar: `<circle class="ring r1" cx="100" cy="105" r="86" fill="none" stroke="var(--buddy-go, #1E8F6E)" stroke-width="3" opacity=".4"/><circle class="ring r2" cx="100" cy="105" r="86" fill="none" stroke="var(--buddy-go, #1E8F6E)" stroke-width="3" opacity=".4"/>
  <g class="body-g">
    <path d="M100 44V14" stroke="var(--buddy-deep, #F2A93B)" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="8" r="8" fill="var(--buddy-go, #1E8F6E)"/><rect x="4" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/><rect x="174" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/>
    <path d="M56 40H144A34 34 0 0 1 178 74V138A34 34 0 0 1 144 172H56A34 34 0 0 1 22 138V74A34 34 0 0 1 56 40Z" fill="url(#bd)" stroke="rgba(22,35,58,.13)" stroke-width="2.5"/>
    <path d="M48 56Q52 22 100 22Q148 22 152 56Z" fill="var(--buddy-ink, #16233A)"/><path d="M42 54H156Q174 54 174 61Q174 68 156 68H42Q38 68 38 61Q38 54 42 54Z" fill="var(--buddy-ink, #16233A)"/><text x="100" y="50" text-anchor="middle" font-size="22" font-weight="800" fill="#FFD46B" font-family="system-ui, sans-serif">B</text>

    <g transform="translate(100 108)"><path d="M-33 -3Q-24 8 -15 -3" stroke="var(--buddy-ink, #16233A)" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M15 -3Q24 8 33 -3" stroke="var(--buddy-ink, #16233A)" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="-40" cy="13" rx="8.5" ry="5.2" fill="var(--buddy-blush, #EF8199)" opacity=".5"/><ellipse cx="40" cy="13" rx="8.5" ry="5.2" fill="var(--buddy-blush, #EF8199)" opacity=".5"/><path d="M-11 30Q0 38 11 30" stroke="var(--buddy-ink, #16233A)" stroke-width="5" fill="none" stroke-linecap="round"/></g>
  </g>`,
  beklagar: `<g class="body-g">
    <path d="M100 44V14" stroke="var(--buddy-deep, #F2A93B)" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="8" r="8" fill="var(--buddy-go, #1E8F6E)"/><rect x="4" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/><rect x="174" y="92" width="22" height="42" rx="10" fill="var(--buddy-deep, #F2A93B)"/>
    <path d="M56 40H144A34 34 0 0 1 178 74V138A34 34 0 0 1 144 172H56A34 34 0 0 1 22 138V74A34 34 0 0 1 56 40Z" fill="url(#bd)" stroke="rgba(22,35,58,.13)" stroke-width="2.5"/>
    <path d="M48 56Q52 22 100 22Q148 22 152 56Z" fill="var(--buddy-ink, #16233A)"/><path d="M42 54H156Q174 54 174 61Q174 68 156 68H42Q38 68 38 61Q38 54 42 54Z" fill="var(--buddy-ink, #16233A)"/><text x="100" y="50" text-anchor="middle" font-size="22" font-weight="800" fill="#FFD46B" font-family="system-ui, sans-serif">B</text>

    <g transform="translate(100 108)"><g class="eyes blink">
      <ellipse cx="-24" cy="3" rx="9" ry="11.5" fill="var(--buddy-ink, #16233A)"/>
      <ellipse cx="24" cy="3" rx="9" ry="11.5" fill="var(--buddy-ink, #16233A)"/>
      <circle cx="-27" cy="-1.5" r="3.1" fill="#fff" opacity=".92"/>
      <circle cx="21" cy="-1.5" r="3.1" fill="#fff" opacity=".92"/>
    </g><path d="M-35 -14L-14 -22" stroke="var(--buddy-ink, #16233A)" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M35 -14L14 -22" stroke="var(--buddy-ink, #16233A)" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M-11 36Q0 28 11 36" stroke="var(--buddy-ink, #16233A)" stroke-width="5" fill="none" stroke-linecap="round"/></g>
  </g>`,
} as const;

const CSS = `
.buddy-avatar{display:block}
.buddy-avatar .body-g{animation:buddy-breathe 4.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 88%}
.buddy-avatar .blink{animation:buddy-blink 5.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}
.buddy-avatar .hand{animation:buddy-wave 1s ease-in-out infinite;transform-box:fill-box;transform-origin:30% 80%}
.buddy-avatar .dot{animation:buddy-bob 1.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}
.buddy-avatar .d2{animation-delay:.15s}
.buddy-avatar .d3{animation-delay:.3s}
.buddy-avatar .spark{animation:buddy-twinkle 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}
.buddy-avatar .ring{animation:buddy-ripple 2.6s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}
.buddy-avatar .r2{animation-delay:1.3s}
@keyframes buddy-breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-2.5px) scale(1.014)}}
@keyframes buddy-blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.08)}}
@keyframes buddy-wave{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(18deg)}}
@keyframes buddy-bob{0%,100%{transform:translateY(0);opacity:.45}50%{transform:translateY(-6px);opacity:1}}
@keyframes buddy-twinkle{0%,100%{transform:scale(.6);opacity:.35}50%{transform:scale(1.1);opacity:1}}
@keyframes buddy-ripple{0%{transform:scale(.85);opacity:.5}100%{transform:scale(1.25);opacity:0}}
@media(prefers-reduced-motion:reduce){.buddy-avatar *{animation:none !important}}
`;

export const EMOTIONS = Object.keys(FACES) as BuddyEmotion[];
export type BuddyEmotion = keyof typeof FACES;

export default function Buddy({
  emotion = "vilar",
  size = 120,
  className = "",
  title,
}: {
  emotion?: BuddyEmotion;
  size?: number;
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const key = FACES[emotion] ? emotion : "vilar";
  // gradient-id måste vara unikt per instans, annars krockar flera Buddys på samma sida
  const markup = FACES[key].replace(/url\(#bd\)/g, `url(#bd-${uid})`);

  return (
    <svg
      className={`buddy-avatar ${className}`}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{CSS}</style>
      <defs>
        <linearGradient id={`bd-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--buddy-light, #FFD46B)" />
          <stop offset="1" stopColor="var(--buddy-deep, #F2A93B)" />
        </linearGradient>
      </defs>
      <g dangerouslySetInnerHTML={{ __html: markup }} />
    </svg>
  );
}
