import Link from "next/link";
import { ArrowRight, Car, CreditCard, Home, PawPrint, Repeat, UserRound, Wifi, Zap } from "lucide-react";

const GROUPS = [
  {
    title: "Försäkring",
    categories: [
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
    ],
  },
  {
    title: "Telekom & prenumerationer",
    categories: [
      {
        icon: Wifi,
        title: "Mobil & bredband",
        desc: "Mobilabonnemang, hemmabredband eller TV/streaming — lägg in vad du har idag så ser du snabbt om det finns bättre alternativ.",
        points: ["Mobilabonnemang", "Bredband (fiber/kabel/mobilt)", "TV & streaming"],
      },
      {
        icon: Repeat,
        title: "Övriga abonnemang",
        desc: "Gym, medlemskap och annat du betalar för varje månad, oavsett om det passar någon annan kategori.",
        points: ["Valfri kategori", "Pris per månad", "Bindningstid"],
      },
    ],
  },
  {
    title: "Ekonomi",
    categories: [
      {
        icon: CreditCard,
        title: "Kreditkort",
        desc: "Registrera kortet du redan har, eller utforska vad som är viktigast för dig i ett nytt — låg avgift, bonus eller reseförsäkring.",
        points: ["Årsavgift & ränta", "Bonusprogram", "Utforska nytt kort"],
      },
      {
        icon: Zap,
        title: "El & energi",
        desc: "Rörligt, fast eller mix — och vilket elområde du tillhör påverkar vad som är rätt avtal för dig.",
        points: ["Rörligt/fast pris", "Elområde SE1–SE4", "Årsförbrukning"],
      },
    ],
  },
];

export default function JamforPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">Jämför</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-4">Allt du betalar för, på ett ställe</h1>
      <p className="text-base mb-12 max-w-xl text-slate">
        Istället för generiska paket ställer Buddy olika frågor beroende på vad du lägger in —
        så att jämförelsen faktiskt speglar din situation. Försäkring, telekom och ekonomi,
        allt på samma ställe.
      </p>

      <div className="flex flex-col gap-12 mb-12">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <div className="text-sm font-semibold mb-4 text-slate">{group.title}</div>
            <div className="flex flex-col gap-6">
              {group.categories.map((c) => (
                <div key={c.title} className="bg-white rounded-2xl border border-line p-6 flex gap-5 flex-col sm:flex-row">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none bg-frost-2">
                    <c.icon size={20} className="text-forest" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg mb-1.5">{c.title}</div>
                    <p className="text-sm mb-3 text-slate">{c.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {c.points.map((p) => (
                        <span key={p} className="text-xs font-medium px-3 py-1.5 rounded-full bg-frost text-forest">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
