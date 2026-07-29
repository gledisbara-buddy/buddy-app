export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            width: i === current ? 28 : 14,
            borderRadius: 999,
            background: i <= current ? "var(--color-forest)" : "var(--color-line)",
            transition: "width .3s ease",
          }}
        />
      ))}
    </div>
  );
}
