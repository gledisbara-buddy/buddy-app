"use client";

export function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(51,70,92,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bd-fade w-full max-w-sm bg-white rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
