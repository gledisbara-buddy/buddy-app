// Ersätter "return null" under laddning på huvudsidorna — en tom vit
// blink mellan varje sidbyte kändes klumpigt. Generisk, inte
// pixel-exakt per sida (header + några pulserande block) eftersom
// syftet bara är att undvika den blanka flashen, inte att efterlikna
// varje sidas exakta layout.
export function PageSkeleton() {
  return (
    <div className="min-h-screen w-full">
      <div
        className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-line"
        style={{ background: "var(--color-frost-90)" }}
      >
        <div className="h-6 w-24 rounded-lg bg-frost-2 animate-pulse" />
        <div className="h-9 w-9 rounded-full bg-frost-2 animate-pulse" />
      </div>
      <div className="max-w-4xl mx-auto px-5 md:px-10 py-10">
        <div className="h-3.5 w-28 rounded bg-frost-2 animate-pulse mb-3" />
        <div className="h-8 w-64 rounded-lg bg-frost-2 animate-pulse mb-8" />
        <div className="h-28 rounded-2xl bg-frost-2 animate-pulse mb-4" />
        <div className="h-28 rounded-2xl bg-frost-2 animate-pulse mb-4" />
        <div className="h-28 rounded-2xl bg-frost-2 animate-pulse" />
      </div>
    </div>
  );
}
