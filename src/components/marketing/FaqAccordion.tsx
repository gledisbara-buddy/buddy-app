"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FaqItem } from "@/lib/faq";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="bg-white rounded-2xl border border-line">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 p-5 text-left"
            >
              <span className="font-medium text-[15px]">{item.question}</span>
              {isOpen ? (
                <ChevronUp size={16} className="text-slate flex-none" />
              ) : (
                <ChevronDown size={16} className="text-slate flex-none" />
              )}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm bd-fade text-slate">{item.answer}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
