import { Heart, Lightbulb, ShieldCheck } from "lucide-react";

const VALUES = [
  {
    icon: Lightbulb,
    title: "Enkelt före krångligt",
    desc: "Försäkringsvillkor ska gå att förstå. Vi översätter krångliga begrepp till vanlig svenska.",
  },
  {
    icon: ShieldCheck,
    title: "På din sida",
    desc: "Buddy jobbar för dig, inte för ett enskilt försäkringsbolag. Vi visar alternativen ärligt.",
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
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-6">Vi tycker försäkring ska vara enkelt</h1>
      <p className="text-base mb-4 text-slate">
        Buddy startades med en enkel idé: du ska kunna se allt du äger och allt du behöver
        skydda på ett och samma ställe — utan att behöva logga in på fem olika bolags hemsidor
        eller läsa villkor skrivna för jurister.
      </p>
      <p className="text-base mb-10 text-slate">
        Vi hjälper dig lägga in dina saker, jämföra skydd och pris, och finns kvar genom hela
        resan — från första frågan till en skadeanmälan mitt i natten.
      </p>

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
          och offerter i appen är fiktiva exempel och ska inte tolkas som riktiga
          försäkringserbjudanden.
        </p>
      </div>
    </div>
  );
}
