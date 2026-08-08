import type { Metadata } from "next";
import Image from "next/image";
import { Heart, Lightbulb, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Om oss",
  description:
    "Buddy hjälper dig samla, jämföra och hålla koll på allt du betalar för — försäkring, mobil, kreditkort och el — på ett ställe.",
};

const VALUES = [
  {
    icon: Lightbulb,
    title: "Enkelt före krångligt",
    desc: "Villkor och avtal ska gå att förstå. Vi översätter krångliga begrepp till vanlig svenska — oavsett om det handlar om försäkring, mobilabonnemang eller kreditkort.",
  },
  {
    icon: ShieldCheck,
    title: "På din sida",
    desc: "Buddy jobbar för dig, inte för en enskild leverantör. Vi visar alternativen ärligt.",
  },
  {
    icon: Heart,
    title: "Finns när det gäller",
    desc: "Vid en skada räknas varje minut. Vi gör anmälan så enkel och snabb som möjligt.",
  },
];

export default function OmOssPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">Om oss</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-6">Vi tycker det du betalar för ska vara enkelt att överblicka</h1>
      <p className="text-base mb-4 text-slate">
        Buddy startades med en enkel idé inom försäkring: du ska kunna se allt du äger och allt
        du behöver skydda på ett och samma ställe — utan att behöva logga in på fem olika bolags
        hemsidor eller läsa villkor skrivna för jurister.
      </p>
      <p className="text-base mb-12 text-slate">
        Vi insåg snabbt att samma problem gäller nästan allt man betalar löpande för — mobil,
        bredband, kreditkort, el. Idag hjälper Buddy dig lägga in allt det du äger och
        prenumererar på, jämföra skydd och pris där det går, och finns kvar genom hela resan —
        från första frågan till en skadeanmälan mitt i natten.
      </p>

      <div className="rounded-3xl border border-line bg-white p-6 md:p-8 mb-12 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden flex-none relative">
          <Image
            src="/images/founder.jpg"
            alt="Gledis Bara, grundare och VD för Buddy"
            fill
            sizes="144px"
            className="object-cover"
            style={{ objectPosition: "50% 15%" }}
          />
        </div>
        <div className="text-center sm:text-left">
          <div className="font-semibold text-lg">Gledis Bara</div>
          <div className="text-sm mb-3 text-forest">Grundare & VD</div>
          <p className="text-sm text-slate">
            Gledis har jobbat i försäkringsbranschen som villkorsspecialist, rådgivare och
            jämförare — och har sett samma sak om och om igen: bra avtal finns, men det är
            nästan omöjligt för vanliga kunder att hitta dem själva. Han startade Buddy för att
            ge alla samma överblick som en personlig rådgivare annars ger — och insåg snabbt att
            principen gäller lika mycket för mobilabonnemang och kreditkort som för försäkring.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-12">
        {VALUES.map((v) => (
          <div key={v.title} className="bg-white rounded-2xl border border-line p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-frost-2">
              <v.icon size={18} className="text-forest" />
            </div>
            <div className="font-semibold text-[15px] mb-1.5">{v.title}</div>
            <p className="text-sm text-slate">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line p-6 bg-frost-2">
        <p className="text-sm text-ink">
          <b>Bra att veta:</b> Buddy är i det här skedet en designprototyp. Bolagsnamn, priser
          och offerter i appen är fiktiva exempel och ska inte tolkas som riktiga erbjudanden.
        </p>
      </div>
    </div>
  );
}
