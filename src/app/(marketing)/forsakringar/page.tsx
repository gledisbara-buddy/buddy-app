import Link from "next/link";
import { ArrowRight, Car, Home, PawPrint, UserRound } from "lucide-react";

const CATEGORIES = [
  {
    icon: Home,
    title: "Boende",
    desc: "Hyresrätt, bostadsrätt, villa, fritidshus eller magasinering — vi ställer rätt frågor beroende på vad du bor i, så att skyddet faktiskt matchar ditt hem.",
    points: ["Lösöre och byggnad", "Ansvar och rättsskydd", "Drulle- och reseskydd som tillägg"],
  },
  {
    icon: Car,
    title: "Bil & fordon",
    desc: "Bil, MC, husvagn, båt eller släp. Ange registreringsnummer så hjälper vi dig hämta fordonsinformationen automatiskt.",
    points: ["Trafik, halv- och helförsäkring", "Vagnskada", "Anpassat efter körsträcka"],
  },
  {
    icon: UserRound,
    title: "Person",
    desc: "Olycksfall, sjuk- och efterlevandeskydd eller barnförsäkring — för dig, din partner eller dina barn.",
    points: ["Olycksfallsförsäkring", "Sjuk- och efterlevandeskydd", "Barnförsäkring"],
  },
  {
    icon: PawPrint,
    title: "Djur",
    desc: "Hund, katt eller något annat — veterinärvård kostar, och vi hjälper dig hitta rätt nivå av skydd.",
    points: ["Veterinärvårdskostnader", "Liv- och trygghetsskydd", "Anpassat efter ras och ålder"],
  },
];

export default function ForsakringarPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">Försäkringar</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-4">Skydd för det du faktiskt äger</h1>
      <p className="text-base mb-12 max-w-xl text-slate">
        Istället för generiska paket ställer Buddy olika frågor beroende på vad du lägger in —
        så att jämförelsen faktiskt speglar din situation.
      </p>

      <div className="flex flex-col gap-6 mb-12">
        {CATEGORIES.map((c) => (
          <div key={c.title} className="bg-white rounded-2xl border border-line p-6 flex gap-5 flex-col sm:flex-row">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none bg-frost-2">
              <c.icon size={20} className="text-forest" />
            </div>
            <div>
              <div className="font-semibold text-lg mb-1.5">{c.title}</div>
              <p className="text-sm mb-3 text-slate">{c.desc}</p>
              <div className="flex flex-wrap gap-2">
                {c.points.map((p) => (
                  <span
                    key={p}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-frost text-forest"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/kom-igang"
          className="bd-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-white text-[15px] bg-forest"
        >
          Kom igång <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
