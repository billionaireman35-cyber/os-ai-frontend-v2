export function OsAiMark({ size = 64, animated = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="OS AI"
    >
      <defs>
        <linearGradient id="osai-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-brass-bright, #E8C877)" />
          <stop offset="100%" stopColor="var(--accent-brass, #C9A961)" />
        </linearGradient>
      </defs>
      <path
        d="M 26 68 L 50 26 L 74 68"
        fill="none"
        stroke="url(#osai-gold)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-pulse-slow' : ''}
      />
    </svg>
  );
}
