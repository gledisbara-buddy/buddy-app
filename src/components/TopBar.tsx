import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function TopBar({
  onBack,
  right,
}: {
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 md:px-8 py-4 border-b flex-none border-line"
      style={{ background: "var(--color-frost-90)" }}
    >
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="opacity-60 hover:opacity-100"
            aria-label="Tillbaka till översikten"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <Logo />
      </div>
      {right}
    </div>
  );
}
