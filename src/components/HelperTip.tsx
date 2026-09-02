"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import Buddy, { type BuddyEmotion } from "@/components/Buddy";

export function HelperTip({
  children,
  dismissible = true,
  size = 48,
  emotion = "vilar",
  className = "",
}: {
  children: ReactNode;
  dismissible?: boolean;
  size?: number;
  emotion?: BuddyEmotion;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={`flex items-start gap-3 bd-fade ${className}`}>
      <Buddy emotion={emotion} size={size} />
      <div className="relative flex-1 bg-white border border-line rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="text-xs font-semibold text-forest mb-0.5">Buddy</div>
        <div className="text-sm text-ink leading-snug">{children}</div>
        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Stäng tips"
            className="absolute top-2 right-2 text-slate hover:text-ink"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
