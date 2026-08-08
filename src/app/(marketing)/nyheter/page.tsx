import type { Metadata } from "next";
import Link from "next/link";
import { NEWS_ARTICLES } from "@/lib/news";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}

export const metadata: Metadata = {
  title: "Nyheter & aktuellt",
  description: "Kort och konkret om vad som är på gång i försäkringsvärlden, och tips som faktiskt gör skillnad.",
};

export default function NyheterPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">Nyheter & aktuellt</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-4">Nyheter och tips om försäkring</h1>
      <p className="text-base mb-10 max-w-xl text-slate">
        Kort och konkret om vad som är på gång i försäkringsvärlden, och tips som faktiskt gör
        skillnad.
      </p>

      <div className="flex flex-col gap-4">
        {NEWS_ARTICLES.map((a) => (
          <Link
            key={a.slug}
            href={`/nyheter/${a.slug}`}
            className="bd-card block bg-white rounded-2xl border border-line p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-frost-2 text-forest">
                {a.category}
              </span>
              <span className="text-xs text-slate">{formatDate(a.date)}</span>
            </div>
            <div className="font-semibold text-lg mb-1.5">{a.title}</div>
            <p className="text-sm text-slate">{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
