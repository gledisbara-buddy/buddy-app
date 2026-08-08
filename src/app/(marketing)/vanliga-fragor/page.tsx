import type { Metadata } from "next";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { FAQ_ITEMS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Vanliga frågor",
  description: "Kort svar på de vanligaste frågorna om Buddy och hur tjänsten fungerar.",
};

export default function VanligaFragorPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">Support</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-8">Vanliga frågor</h1>
      <FaqAccordion items={FAQ_ITEMS} />
    </div>
  );
}
