import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Kontakt",
  description: "Så når du Buddys kundtjänst — telefon, e-post och kontor.",
});

const CHANNELS = [
  { icon: Phone, title: "Telefon", value: "010-123 45 67", desc: "Vardagar 8–18" },
  { icon: Mail, title: "E-post", value: "hej@buddyforsakring.se", desc: "Svar inom 1 arbetsdag" },
  { icon: MapPin, title: "Kontor", value: "Sveavägen 44, Stockholm", desc: "Besök endast efter bokning" },
];

export default function KontaktPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">Kontakt</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-4">Prata med oss</h1>
      <p className="text-base mb-10 text-slate">
        Redan kund? Öppna &quot;Fråga Buddy&quot; eller boka en specialist direkt i din översikt —
        det är snabbast. Annars når du oss här:
      </p>

      <div className="flex flex-col gap-4 mb-10">
        {CHANNELS.map((c) => (
          <div key={c.title} className="bg-white rounded-2xl border border-line p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none bg-frost-2">
              <c.icon size={19} className="text-forest" />
            </div>
            <div>
              <div className="text-xs text-slate">{c.title}</div>
              <div className="font-semibold text-[15px]">{c.value}</div>
              <div className="text-xs text-slate">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line p-5 flex items-start gap-3 bg-frost-2">
        <Clock size={16} className="mt-0.5 flex-none text-amber-deep" />
        <p className="text-sm text-ink">
          Kundtjänsten har längre svarstider under kvällar och helger. Vid akut skada — anmäl
          direkt i appen, det går dygnet runt.
        </p>
      </div>
    </div>
  );
}
