import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getArticleBySlug, NEWS_ARTICLES } from "@/lib/news";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}

export function generateStaticParams() {
  return NEWS_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

export default async function NyhetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <Link href="/nyheter" className="flex items-center gap-1.5 text-sm mb-8 opacity-60 hover:opacity-100">
        <ArrowLeft size={15} /> Alla nyheter
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-frost-2 text-forest">
          {article.category}
        </span>
        <span className="text-xs text-slate">{formatDate(article.date)}</span>
      </div>
      <h1 className="bd-display text-3xl md:text-4xl mb-8">{article.title}</h1>
      <div className="flex flex-col gap-4">
        {article.body.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-slate">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
