import type { Metadata } from "next";
import Image from "next/image";
import {
  BadgeCheck,
  CheckCircle2,
  Headset,
  LayoutGrid,
  Quote,
  Sparkles,
  Star,
  Unlock,
  type LucideIcon,
} from "lucide-react";
import { CategoryCta } from "@/components/marketing/CategoryCta";
import { StartCta } from "@/components/marketing/StartCta";
import { ITEM_CATEGORIES, ITEM_GROUPS, type ItemGroupId, type ItemKind } from "@/lib/items";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Jämför försäkring, mobil, kreditkort och el",
  description:
    "Lägg in det du har så ställer Buddy rätt frågor och visar var du kan spara — försäkring, mobil & bredband, kreditkort och el.",
});

const STATS = [
  { value: "14 500+", label: "jämförelser gjorda" },
  { value: "30+", label: "bolag & leverantörer" },
  { value: "4.7 / 5", label: "snittbetyg från användare" },
];

const BENEFITS: { icon: LucideIcon; label: string }[] = [
  { icon: BadgeCheck, label: "Alltid gratis att jämföra" },
  { icon: Unlock, label: "Ingen bindningstid för att jämföra" },
  { icon: Headset, label: "Personlig hjälp om du vill ha den" },
  { icon: LayoutGrid, label: "Allt samlat på ett ställe" },
];

const STEPS = [
  { n: "1", title: "Lägg in det du har", desc: "Boende, bil, mobil, kreditkort — en sak i taget, i din egen takt." },
  { n: "2", title: "Vi ställer rätt frågor", desc: "Frågorna anpassas efter vad du lägger in, inte ett generiskt paket." },
  { n: "3", title: "Se var du kan spara", desc: "Jämför pris och villkor sida vid sida, och byt bara om du vill." },
];

const GROUP_INTRO: Record<ItemGroupId, { title: string; desc: string; bullets: string[] }> = {
  forsakring: {
    title: "Rätt skydd för det du äger",
    desc: "Boende, bil, person eller husdjur — vi ställer olika frågor beroende på vad du har, så att jämförelsen faktiskt speglar din situation.",
    bullets: ["Skräddarsydda frågor per sak", "Jämför pris och villkor sida vid sida", "Byt när du vill, ingen bindningstid"],
  },
  mobil: {
    title: "Ditt mobilabonnemang, granskat",
    desc: "Lägg in vad du betalar för mobilen idag så ser du snabbt om det finns bättre alternativ — samma nät, lägre pris.",
    bullets: ["Jämför pris, data och bindningstid", "Uppskattad nätverkstäckning per operatör", "Byt utan att tappa numret"],
  },
  prenumeration: {
    title: "Bredband, streaming och alla dina abonnemang",
    desc: "Bredband, TV-streaming, gymkort eller andra abonnemang — lägg in vad du betalar idag så samlar Buddy allt på ett ställe.",
    bullets: ["Bredband och TV/streaming", "Övriga abonnemang i en samlad lista", "Se allt du betalar per månad"],
  },
  ekonomi: {
    title: "Koll på kort och elavtal",
    desc: "Kreditkort och elavtal påverkar din vardagsekonomi mer än du tror. Vi hjälper dig hålla koll på båda.",
    bullets: ["Jämför årsavgift, ränta och bonus", "Rätt elavtal för ditt elområde", "Utforska nya kort utan att committa"],
  },
};

const CATEGORY_COPY: Record<ItemKind, { desc: string; points: string[] }> = {
  boende: {
    desc: "Hyresrätt, bostadsrätt, villa, fritidshus eller magasinering — vi anpassar frågorna efter vad du bor i.",
    points: ["Lösöre & byggnad", "Ansvar & rättsskydd", "Drulle- och resetillägg"],
  },
  bil: {
    desc: "Ange registreringsnumret så hämtar vi fordonsinformationen automatiskt och ställer rätt följdfrågor.",
    points: ["Trafik, halv- eller helförsäkring", "Vagnskadeskydd", "Baserat på din körsträcka"],
  },
  ovrigt_fordon: {
    desc: "MC, husvagn, båt eller släp — vi ställer olika frågor beroende på vilket fordon det gäller.",
    points: ["MC, husvagn, båt & släp", "Regnr-uppslag där det går", "Typanpassade följdfrågor"],
  },
  person: {
    desc: "Olycksfall, sjuk- och efterlevandeskydd eller barnförsäkring — för dig, din partner eller dina barn.",
    points: ["Olycksfallsförsäkring", "Sjuk- och efterlevandeskydd", "Barnförsäkring"],
  },
  djur: {
    desc: "Hund, katt eller något annat — veterinärvård kostar, och vi hjälper dig hitta rätt nivå av skydd.",
    points: ["Veterinärvårdskostnader", "Liv- och trygghetsskydd", "Anpassat efter ras & ålder"],
  },
  telekom: {
    desc: "Mobilabonnemang, hemmabredband eller TV/streaming — lägg in vad du har idag och se om det finns bättre alternativ.",
    points: ["Mobilabonnemang", "Bredband (fiber/kabel/mobilt)", "TV & streaming"],
  },
  kreditkort: {
    desc: "Registrera kortet du redan har, eller utforska vad som är viktigast för dig i ett nytt.",
    points: ["Årsavgift & ränta", "Bonusprogram", "Utforska nytt kort"],
  },
  el: {
    desc: "Rörligt, fast eller mix — och ditt elområde påverkar vad som är rätt avtal för dig.",
    points: ["Rörligt eller fast pris", "Elområde SE1–SE4", "Årsförbrukning"],
  },
  prenumeration: {
    desc: "Gym, medlemskap och annat du betalar för varje månad, oavsett om det passar någon annan kategori.",
    points: ["Valfri typ av abonnemang", "Pris per månad", "Bindningstid"],
  },
};

const TESTIMONIALS = [
  {
    quote: "Jag visste inte att jag betalade dubbelt för samma skydd förrän jag lade in allt i Buddy.",
    name: "Sara, 34",
    context: "Jämförde boende & bil",
    rating: 5,
  },
  {
    quote: "Bytte elavtal på fem minuter och sparade över 100 kr i månaden.",
    name: "Johan, 41",
    context: "Jämförde el & kreditkort",
    rating: 5,
  },
  {
    quote: "Skönt att se mobil, bredband och försäkring på samma ställe för en gångs skull.",
    name: "Elin, 27",
    context: "Jämförde mobil & boende",
    rating: 4,
  },
];

const CORNERS = {
  topLeft: { top: "4%", left: "0%" },
  topRight: { top: "0%", right: "8%" },
  bottomLeft: { bottom: "10%", left: "4%" },
  bottomRight: { bottom: "0%", right: "0%" },
} as const;

const LAYOUTS: Record<number, (keyof typeof CORNERS)[]> = {
  1: ["topRight"],
  2: ["topRight", "bottomLeft"],
  3: ["topLeft", "topRight", "bottomLeft"],
  4: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
};

function GroupVisual({ group }: { group: (typeof ITEM_GROUPS)[number] }) {
  const Icon = group.icon;
  const satelliteKinds = group.kinds.slice(0, 4);
  const layout = LAYOUTS[satelliteKinds.length] ?? LAYOUTS[4];

  return (
    <div className="relative w-full aspect-square max-w-[260px] mx-auto">
      <div className="absolute inset-[10%] rounded-[2.5rem] bg-frost-2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full flex items-center justify-center bg-forest">
        <Icon size={40} className="text-white" />
      </div>
      {satelliteKinds.map((kind, i) => {
        const cat = ITEM_CATEGORIES.find((c) => c.kind === kind)!;
        const SatIcon = cat.icon;
        return (
          <div
            key={kind}
            className="absolute w-14 h-14 rounded-2xl bg-white border border-line flex items-center justify-center shadow-sm"
            style={CORNERS[layout[i]]}
          >
            <SatIcon size={20} className="text-forest" />
          </div>
        );
      })}
    </div>
  );
}

function GroupSection({ group, index }: { group: (typeof ITEM_GROUPS)[number]; index: number }) {
  const intro = GROUP_INTRO[group.id];
  const alt = index % 2 === 1;

  return (
    <section id={group.id} className={`py-16 border-t border-line ${alt ? "bg-frost-2" : ""}`}>
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        <div className={`flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-12 ${alt ? "lg:flex-row-reverse" : ""}`}>
          <div className="w-full lg:w-[280px] flex-none">
            <GroupVisual group={group} />
          </div>
          <div className="flex-1">
            <span className="bd-eyebrow">{group.label}</span>
            <h2 className="bd-display text-2xl md:text-3xl mt-3 mb-4">{intro.title}</h2>
            <p className="text-base mb-5 max-w-xl text-slate">{intro.desc}</p>
            <ul className="flex flex-col gap-2">
              {intro.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-ink">
                  <CheckCircle2 size={15} className="flex-none text-forest" /> {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.kinds.map((kind) => {
            const cat = ITEM_CATEGORIES.find((c) => c.kind === kind)!;
            const copy = CATEGORY_COPY[kind];
            const Icon = cat.icon;
            return (
              <div key={kind} className="bd-card bg-white rounded-2xl border border-line p-6 flex flex-col">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-frost-2">
                  <Icon size={20} className="text-forest" />
                </div>
                <div className="font-semibold text-[15px] mb-1.5">{cat.label}</div>
                <p className="text-sm mb-4 flex-1 text-slate">{copy.desc}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {copy.points.map((p) => (
                    <span key={p} className="text-xs font-medium px-2.5 py-1 rounded-full bg-frost text-forest">
                      {p}
                    </span>
                  ))}
                </div>
                <CategoryCta
                  kind={kind}
                  label={`Lägg till ${cat.label.toLowerCase()}`}
                  className="bd-btn mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-forest"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function JamforPage() {
  return (
    <div className="bd-fade">
      <section className="max-w-6xl mx-auto px-5 md:px-10 pt-16 pb-14">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center mb-14">
          <div className="text-center md:text-left">
            <span className="bd-eyebrow inline-block px-3 py-1.5 rounded-full bg-frost-2">Jämför</span>
            <h1 className="bd-display text-4xl md:text-5xl mt-6 mb-5 leading-[1.05]">
              En jämförelsetjänst för allt du betalar för
            </h1>
            <p className="text-base md:text-lg mb-8 max-w-xl mx-auto md:mx-0 text-slate">
              Försäkring, mobil & bredband, kreditkort, el — lägg in det du har så ställer Buddy
              rätt frågor och visar var du kan spara.
            </p>
            <div className="flex justify-center md:justify-start">
              <StartCta className="bd-btn px-6 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest inline-flex items-center gap-2" />
            </div>
          </div>
          <div className="relative w-full rounded-[2rem] overflow-hidden aspect-[4/5] max-w-sm mx-auto md:max-w-none">
            <Image
              src="/images/hero-compare.jpg"
              alt="Två personer som jämför sina abonnemang tillsammans hemma"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 80vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="bd-display text-2xl md:text-3xl text-forest">{s.value}</div>
              <div className="text-xs mt-1 text-slate">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4 text-center text-slate">Exempeldata i den här prototypen — siffrorna är fiktiva.</p>
      </section>

      <section className="border-t border-y border-line bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.label} className="flex items-center gap-2.5">
              <b.icon size={18} className="flex-none text-forest" />
              <span className="text-sm font-medium text-ink">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 md:px-10 py-16">
        <div className="text-center mb-10">
          <span className="bd-eyebrow">Så funkar det</span>
          <h2 className="bd-display text-3xl mt-3">Från fråga till svar på några minuter</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 bd-display text-white bg-forest">
                {s.n}
              </div>
              <div className="font-semibold text-[15px] mb-1.5">{s.title}</div>
              <p className="text-sm text-slate">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {ITEM_GROUPS.map((group, i) => (
        <GroupSection key={group.id} group={group} index={i} />
      ))}

      <section className="py-16 border-t border-line bg-frost-2">
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          <div className="text-center mb-10">
            <span className="bd-eyebrow">Vad andra säger</span>
            <h2 className="bd-display text-3xl mt-3">Är det värt fem minuter? Fråga dem som testat.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-line p-6 flex flex-col">
                <Quote size={20} className="mb-3 text-amber-deep" />
                <p className="text-sm mb-4 flex-1 text-ink">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-1 mb-2 text-amber-deep">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill={i < t.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-slate">{t.context}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-center mt-6 text-slate">
            Exempelröster i den här prototypen — inga riktiga användarcitat än.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 md:px-10 py-20 text-center border-t border-line">
        <Sparkles size={22} className="mx-auto mb-4 text-amber-deep" />
        <h2 className="bd-display text-2xl md:text-3xl mb-3">Redo att se vad du kan spara?</h2>
        <p className="text-sm mb-7 text-slate">
          Det tar bara ett par minuter att lägga in det första du vill jämföra.
        </p>
        <StartCta className="bd-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest" />
      </section>
    </div>
  );
}
