import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  FileX,
  Fingerprint,
  Layers,
  LifeBuoy,
  MessageCircle,
  Scale,
  Sparkles,
  Star,
} from "lucide-react";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { StartCta } from "@/components/marketing/StartCta";
import { FAQ_ITEMS } from "@/lib/faq";
import { GUIDES } from "@/lib/guides";
import { NEWS_ARTICLES } from "@/lib/news";
import { TOP_LIST } from "@/lib/top-list";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}

export const metadata: Metadata = {
  title: "Allt du betalar för, på ett ställe",
  description:
    "Försäkring, mobil & bredband, kreditkort, el — Buddy samlar allt på ett ställe, hjälper dig jämföra, säger upp det gamla åt dig, och finns kvar när något händer.",
};

const PILLARS = [
  {
    icon: Layers,
    title: "Samla",
    desc: "Logga in med BankID och se allt du redan betalar för på under en minut — försäkring, mobil, kreditkort, el. Eller lägg till för hand, i din egen takt.",
  },
  {
    icon: Scale,
    title: "Jämför",
    desc: "Se pris och villkor sida vid sida, utan att besöka fem olika bolags hemsidor. Buddy rankar aldrig ett bolag högre för att de betalar mer för platsen.",
  },
  {
    icon: FileX,
    title: "Säg upp",
    desc: "Bestämmer du dig för att byta sköter Buddy kontakten med det gamla bolaget åt dig — med en fullmakt du när som helst kan återkalla.",
  },
  {
    icon: LifeBuoy,
    title: "Hjälp vid skada",
    desc: "Händer något är Buddy kvar. Anmäl direkt i appen, ladda upp foton, och följ ärendet hela vägen till beslut.",
  },
];

const STEPS = [
  {
    icon: Fingerprint,
    title: "Logga in med BankID",
    desc: "Se allt du redan har hämtat automatiskt — eller skapa konto och lägg till för hand om du hellre vill.",
  },
  {
    n: "2",
    title: "Få din trygghetspoäng direkt",
    desc: "Buddy visar vad du har skydd för och vad som eventuellt saknas, baserat på det du faktiskt lagt in.",
  },
  {
    n: "3",
    title: "Jämför, säg upp eller anmäl en skada",
    desc: "Allt i samma app, från och med nu — inga fler inloggningar på fem olika bolags hemsidor.",
  },
];

const SUPPORT = [
  {
    icon: MessageCircle,
    title: "Fråga Buddy",
    desc: "Osäker på vad som täcks eller vad du behöver? Buddy svarar direkt, dygnet runt.",
  },
  {
    icon: CalendarDays,
    title: "Boka en specialist",
    desc: "Vill du hellre prata med en människa? Boka video- eller telefonmöte på några klick.",
  },
];

export default function MarketingHome() {
  return (
    <div>
      <section className="max-w-6xl mx-auto px-5 md:px-10 pt-16 md:pt-20 pb-16 bd-fade">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div className="text-center md:text-left">
            <span className="bd-eyebrow inline-block px-3 py-1.5 rounded-full bg-frost-2">
              Din digitala assistent för allt du betalar för
            </span>
            <h1 className="bd-display text-4xl md:text-5xl mt-6 mb-5 leading-[1.05]">
              Allt du betalar för,
              <br />
              på ett ställe.
            </h1>
            <p className="text-base md:text-lg mb-9 max-w-xl mx-auto md:mx-0 text-slate">
              Logga in med BankID och se allt på under en minut. Jämför, säg upp det gamla och
              få hjälp direkt om något händer — allt på ett ställe.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <StartCta className="bd-btn px-6 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest flex items-center justify-center gap-2" />
              <Link
                href="/jamfor"
                className="bd-btn px-6 py-3.5 rounded-full font-semibold text-[15px] border border-line bg-white flex items-center justify-center gap-2"
              >
                Se allt vi jämför
              </Link>
            </div>
          </div>
          <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3]">
            <Image
              src="/images/hero-couple.jpg"
              alt="Ett par som tillsammans går igenom vad de betalar för i mobilen"
              fill
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-10 py-16 border-t border-line">
        <div className="text-center mb-10">
          <span className="bd-eyebrow">Det här gör Buddy</span>
          <h2 className="bd-display text-3xl mt-3">Fyra saker, en app</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((p, i) => (
            <div key={p.title} className="bd-card relative bg-white rounded-2xl border border-line p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                  <p.icon size={19} className="text-forest" />
                </div>
                <div className="bd-display text-sm w-6 h-6 rounded-full flex items-center justify-center flex-none bg-frost text-forest">
                  {i + 1}
                </div>
              </div>
              <div className="font-semibold text-[15px] mb-1.5">{p.title}</div>
              <p className="text-sm text-slate">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-frost-2 py-16 border-t border-line">
        <div className="max-w-4xl mx-auto px-5 md:px-10">
          <div className="text-center mb-10">
            <span className="bd-eyebrow">Så funkar det</span>
            <h2 className="bd-display text-3xl mt-3">Igång på under en minut</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.title} className="text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 bd-display text-white bg-forest">
                  {s.icon ? <s.icon size={17} /> : s.n}
                </div>
                <div className="font-semibold text-[15px] mb-1.5">{s.title}</div>
                <p className="text-sm text-slate">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 md:px-10 py-16 border-t border-line">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="bd-eyebrow">Topplista</span>
            <h2 className="bd-display text-3xl mt-3">Så rankar vi bolagen i vår försäkringsjämförelse</h2>
          </div>
          <Link href="/jamfor" className="text-sm font-semibold flex items-center gap-1 text-forest">
            Så jämför vi <ArrowRight size={14} />
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {TOP_LIST.map((entry) => (
            <div key={entry.name} className="bg-white rounded-2xl border border-line p-5 flex items-start gap-5">
              <div className="bd-display text-2xl w-8 text-center flex-none text-forest">{entry.rank}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className="font-semibold text-[15px]">{entry.name}</div>
                  <div className="flex items-center gap-1 text-xs text-amber-deep">
                    <Star size={12} fill="currentColor" /> {entry.rating}{" "}
                    <span className="text-slate">({entry.reviews} omdömen)</span>
                  </div>
                </div>
                <p className="text-sm mb-2.5 text-slate">{entry.tagline}</p>
                <div className="flex flex-wrap gap-2">
                  {entry.strengths.map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-frost text-forest">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-center mt-6 text-slate">
          Exempeldata i den här prototypen — bolagsnamn, betyg och omdömen är fiktiva.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-5 md:px-10 py-16 border-t border-line">
        <div className="rounded-3xl bg-white border border-line overflow-hidden flex flex-col md:flex-row">
          <div className="relative w-full md:w-[280px] flex-none aspect-[3/4]">
            <Image
              src="/images/founder.jpg"
              alt="Gledis Bara, grundare av Buddy"
              fill
              sizes="(min-width: 768px) 280px, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 20%" }}
            />
          </div>
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <span className="bd-eyebrow">Från vår specialist</span>
            <h2 className="bd-display text-2xl md:text-3xl mt-3 mb-4">
              Ett vanligt misstag vi ser om och om igen
            </h2>
            <p className="text-sm mb-6 text-slate">
              &quot;Många är dubbelförsäkrade utan att veta om det — eller saknar skydd de tror
              att de redan har. Som villkorsspecialist är det första jag brukar hitta när jag
              hjälper någon gå igenom sina papper. Det är precis det trygghetspoängen i Buddy
              visar dig direkt, utan att du behöver boka ett möte för att fråga.&quot;
            </p>
            <div className="font-semibold text-sm">Gledis Bara</div>
            <div className="text-xs text-slate">Grundare & VD, Buddy</div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-10 py-16 border-t border-line">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="bd-eyebrow">Guider</span>
            <h2 className="bd-display text-3xl mt-3">Lär dig mer innan du väljer</h2>
          </div>
          <Link href="/guider" className="text-sm font-semibold flex items-center gap-1 text-forest">
            Alla guider <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {GUIDES.slice(0, 4).map((g) => (
            <Link key={g.slug} href={`/guider/${g.slug}`} className="bd-card block bg-white rounded-2xl border border-line p-5">
              <div className="font-semibold text-[15px] mb-1.5">{g.title}</div>
              <p className="text-sm mb-3 text-slate">{g.excerpt}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate">
                <Clock size={13} /> {g.readMinutes} min läsning
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-10 py-16 border-t border-line">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="bd-eyebrow">Nyheter & aktuellt</span>
            <h2 className="bd-display text-3xl mt-3">Vad som är aktuellt just nu</h2>
          </div>
          <Link href="/nyheter" className="text-sm font-semibold flex items-center gap-1 text-forest">
            Alla nyheter <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {NEWS_ARTICLES.slice(0, 3).map((a) => (
            <Link key={a.slug} href={`/nyheter/${a.slug}`} className="bd-card block bg-white rounded-2xl border border-line p-5">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-frost-2 text-forest">
                {a.category}
              </span>
              <div className="font-semibold text-[15px] mt-3 mb-1.5 leading-snug">{a.title}</div>
              <p className="text-sm mb-3 text-slate">{a.excerpt}</p>
              <div className="text-xs text-slate">{formatDate(a.date)}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 md:px-10 py-16 border-t border-line">
        <div className="text-center mb-10">
          <span className="bd-eyebrow">Behöver du prata med oss?</span>
          <h2 className="bd-display text-3xl mt-3">Ibland vill man bara fråga någon</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {SUPPORT.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-line p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                <s.icon size={19} className="text-forest" />
              </div>
              <div>
                <div className="font-semibold text-[15px] mb-1">{s.title}</div>
                <p className="text-sm text-slate">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-5 md:px-10 py-16 border-t border-line">
        <div className="text-center mb-8">
          <span className="bd-eyebrow">Vanliga frågor</span>
          <h2 className="bd-display text-3xl mt-3">Kort svar på det vanligaste</h2>
        </div>
        <FaqAccordion items={FAQ_ITEMS.slice(0, 4)} />
        <div className="text-center mt-6">
          <Link href="/vanliga-fragor" className="text-sm font-semibold text-forest">
            Se alla frågor →
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 md:px-10 py-20 text-center border-t border-line">
        <Sparkles size={22} className="text-amber-deep mx-auto mb-4" />
        <h2 className="bd-display text-2xl md:text-3xl mb-3">Redo att se allt du betalar för?</h2>
        <p className="text-sm mb-7 text-slate">
          Under en minut med BankID — eller i din egen takt för hand.
        </p>
        <StartCta className="bd-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest" />
      </section>
    </div>
  );
}
