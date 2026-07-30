import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Lägg in det du äger",
    desc: "Boende, bil, fordon, person eller djur — en sak i taget, i din egen takt. Hoppa över och kom tillbaka när du vill.",
  },
  {
    icon: MessageCircle,
    title: "Fråga Buddy",
    desc: "Osäker på vad som täcks eller vad du behöver? Buddy svarar direkt, dygnet runt.",
  },
  {
    icon: ShieldAlert,
    title: "Snabb skadeanmälan",
    desc: "Berätta vad som hänt, ladda upp foton — Buddy sköter resten av pappersarbetet.",
  },
  {
    icon: CalendarDays,
    title: "Boka en specialist",
    desc: "Vill du hellre prata med en människa? Boka video- eller telefonmöte på några klick.",
  },
];

const STEPS = [
  { n: "1", title: "Logga in med BankID", desc: "Säkert och snabbt, precis som du är van vid." },
  { n: "2", title: "Lägg till dina saker", desc: "Boende, fordon, person eller djur — så mycket eller lite du vill." },
  { n: "3", title: "Få en samlad överblick", desc: "Se allt på ett ställe och jämför när du är redo." },
];

export default function MarketingHome() {
  return (
    <div>
      <section className="max-w-4xl mx-auto px-5 md:px-10 pt-20 pb-16 text-center bd-fade">
        <span
          className="bd-eyebrow inline-block px-3 py-1.5 rounded-full bg-frost-2"
        >
          Din digitala försäkringsassistent
        </span>
        <h1 className="bd-display text-4xl md:text-6xl mt-6 mb-5 leading-[1.05]">
          Försäkring,
          <br />
          förenklad.
        </h1>
        <p className="text-base md:text-lg mb-9 max-w-xl mx-auto text-slate">
          Buddy samlar allt du äger på ett ställe, hjälper dig jämföra och teckna, och finns kvar
          när något händer.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/kom-igang"
            className="bd-btn px-6 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest flex items-center justify-center gap-2"
          >
            Kom igång <ArrowRight size={16} />
          </Link>
          <Link
            href="/forsakringar"
            className="bd-btn px-6 py-3.5 rounded-full font-semibold text-[15px] border border-line bg-white flex items-center justify-center gap-2"
          >
            Se våra försäkringar
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-10 py-16 border-t border-line">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bd-card bg-white rounded-2xl border border-line p-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-frost-2">
                <f.icon size={19} className="text-forest" />
              </div>
              <div className="font-semibold text-[15px] mb-1.5">{f.title}</div>
              <p className="text-sm text-slate">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 md:px-10 py-16 border-t border-line">
        <div className="rounded-3xl bg-white border border-line overflow-hidden grid md:grid-cols-2">
          <div className="relative min-h-[260px]">
            <Image
              src="/founder.jpg"
              alt="Gledis Bara, grundare av Buddy"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 15%" }}
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
              hjälper någon gå igenom sina papper. Buddy är byggt för att du ska kunna se det
              själv, direkt, utan att behöva boka ett möte för att fråga.&quot;
            </p>
            <div className="font-semibold text-sm">Gledis Bara</div>
            <div className="text-xs text-slate">Grundare & VD, Buddy</div>
          </div>
        </div>
      </section>

      <section className="bg-frost-2 py-16 border-t border-line">
        <div className="max-w-4xl mx-auto px-5 md:px-10">
          <div className="text-center mb-10">
            <span className="bd-eyebrow">Så funkar det</span>
            <h2 className="bd-display text-3xl mt-3">Igång på under 5 minuter</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 bd-display text-white bg-forest"
                >
                  {s.n}
                </div>
                <div className="font-semibold text-[15px] mb-1.5">{s.title}</div>
                <p className="text-sm text-slate">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 md:px-10 py-20 text-center">
        <Sparkles size={22} className="text-amber-deep mx-auto mb-4" />
        <h2 className="bd-display text-2xl md:text-3xl mb-3">Redo att komma igång?</h2>
        <p className="text-sm mb-7 text-slate">
          Det tar bara ett par minuter att få en första överblick.
        </p>
        <Link
          href="/kom-igang"
          className="bd-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
        >
          Kom igång <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
