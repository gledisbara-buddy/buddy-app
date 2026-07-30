import Link from "next/link";
import { Clock } from "lucide-react";
import { GUIDES } from "@/lib/guides";

export default function GuiderPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">Guider</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-4">Guider som gör det enklare att välja</h1>
      <p className="text-base mb-10 max-w-xl text-slate">
        Lite längre genomgångar av hur olika försäkringar faktiskt fungerar, utan krångligt
        språk.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guider/${g.slug}`}
            className="bd-card block bg-white rounded-2xl border border-line p-6"
          >
            <div className="font-semibold text-[15px] mb-1.5">{g.title}</div>
            <p className="text-sm mb-4 text-slate">{g.excerpt}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate">
              <Clock size={13} /> {g.readMinutes} min läsning
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
