import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { GUIDE_CATEGORY_LABELS, GUIDES, type GuideCategory } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guider",
  description: "Genomgångar av hur försäkring, mobil, kreditkort, el och Buddy själv faktiskt fungerar, utan krångligt språk.",
};

const CATEGORY_ORDER: GuideCategory[] = ["forsakring", "mobil-bredband", "ekonomi", "buddy"];

export default function GuiderPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">Guider</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-4">Guider som gör det enklare att välja</h1>
      <p className="text-base mb-12 max-w-xl text-slate">
        Längre genomgångar av hur försäkring, mobil, kreditkort och el faktiskt fungerar — och hur
        Buddy själv fungerar, utan krångligt språk.
      </p>

      <div className="flex flex-col gap-12">
        {CATEGORY_ORDER.map((cat) => {
          const items = GUIDES.filter((g) => g.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="font-semibold text-lg mb-4">{GUIDE_CATEGORY_LABELS[cat]}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {items.map((g) => (
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
        })}
      </div>
    </div>
  );
}
