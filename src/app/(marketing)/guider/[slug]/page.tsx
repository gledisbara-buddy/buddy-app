import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { GUIDE_CATEGORY_LABELS, getGuideBySlug, GUIDES } from "@/lib/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.excerpt };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const related = GUIDES.filter((g) => g.category === guide.category && g.slug !== guide.slug).slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <Link href="/guider" className="flex items-center gap-1.5 text-sm mb-8 opacity-60 hover:opacity-100">
        <ArrowLeft size={15} /> Alla guider
      </Link>
      <div className="flex items-center gap-3 text-xs mb-4 text-slate">
        <span className="px-2.5 py-1 rounded-full bg-frost-2 text-forest font-medium">
          {GUIDE_CATEGORY_LABELS[guide.category]}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} /> {guide.readMinutes} min läsning
        </span>
      </div>
      <h1 className="bd-display text-3xl md:text-4xl mb-2">{guide.title}</h1>
      <p className="text-base mb-10 text-slate">{guide.excerpt}</p>

      <div className="flex flex-col gap-8">
        {guide.sections.map((section, i) => (
          <div key={i}>
            {section.heading && <h2 className="font-semibold text-lg mb-3 text-ink-deep">{section.heading}</h2>}
            <div className="flex flex-col gap-4">
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-base leading-relaxed text-slate">
                  {p}
                </p>
              ))}
            </div>
            {section.bullets && (
              <ul className="flex flex-col gap-2.5 mt-4">
                {section.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-base leading-relaxed text-slate">
                    <Check size={16} className="text-forest flex-none mt-1" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {related.length > 0 && (
        <div className="mt-14 pt-8 border-t border-line">
          <div className="text-sm font-semibold mb-4">Fler guider om {GUIDE_CATEGORY_LABELS[guide.category].toLowerCase()}</div>
          <div className="flex flex-col gap-3">
            {related.map((g) => (
              <Link
                key={g.slug}
                href={`/guider/${g.slug}`}
                className="bd-card flex items-center justify-between gap-3 bg-white rounded-2xl border border-line p-4"
              >
                <span className="font-medium text-sm">{g.title}</span>
                <ArrowRight size={15} className="text-slate flex-none" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
