import type { Metadata } from "next";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { FAQ_ITEMS } from "@/lib/faq";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Vanliga frågor",
  description: "Kort svar på de vanligaste frågorna om Buddy och hur tjänsten fungerar.",
});

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function VanligaFragorPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <span className="bd-eyebrow">Support</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-8">Vanliga frågor</h1>
      <FaqAccordion items={FAQ_ITEMS} />
    </div>
  );
}
