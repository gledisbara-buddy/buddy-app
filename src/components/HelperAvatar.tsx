export function HelperAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="flex-none">
      <circle cx="32" cy="32" r="32" fill="var(--color-frost-2)" />
      <circle cx="12" cy="30" r="5" fill="white" stroke="var(--color-forest)" strokeWidth="2" />
      <circle cx="52" cy="30" r="5" fill="white" stroke="var(--color-forest)" strokeWidth="2" />
      <rect x="13" y="10" width="38" height="33" rx="14" fill="white" stroke="var(--color-forest)" strokeWidth="2.5" />
      <path d="M32 3 V9" stroke="var(--color-forest)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="3" r="2.4" fill="var(--color-amber)" />
      <circle cx="25" cy="27" r="2.8" fill="var(--color-forest)" />
      <circle cx="39" cy="27" r="2.8" fill="var(--color-forest)" />
      <path d="M24 35 Q32 40.5 40 35" stroke="var(--color-forest)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path
        d="M32 48 C29 45 24 46 24 50 C24 53.5 32 58 32 58 C32 58 40 53.5 40 50 C40 46 35 45 32 48 Z"
        fill="var(--color-amber)"
      />
    </svg>
  );
}
