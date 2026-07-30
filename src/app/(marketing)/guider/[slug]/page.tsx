import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { getGuideBySlug, GUIDES } from "@/lib/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <Link href="/guider" className="flex items-center gap-1.5 text-sm mb-8 opacity-60 hover:opacity-100">
        <ArrowLeft size={15} /> Alla guider
      </Link>
      <div className="flex items-center gap-1.5 text-xs mb-4 text-slate">
        <Clock size={13} /> {guide.readMinutes} min läsning
      </div>
      <h1 className="bd-display text-3xl md:text-4xl mb-8">{guide.title}</h1>
      <div className="flex flex-col gap-4">
        {guide.body.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-slate">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
