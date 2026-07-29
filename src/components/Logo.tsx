export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="24" viewBox="0 0 30 30" fill="none">
        <circle cx="15" cy="15" r="14" stroke="var(--color-forest)" strokeWidth="2" />
        <path
          d="M9 16.5 L13 20 L21 10"
          stroke="var(--color-forest)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="bd-display text-lg">Buddy</span>
    </div>
  );
}
