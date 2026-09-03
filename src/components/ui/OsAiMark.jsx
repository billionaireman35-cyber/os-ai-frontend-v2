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
      style={{ filter: `drop-shadow(0 0 16px var(--accent-glow, transparent))` }}
    >
      <defs>
        <linearGradient id="osai-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-brass-bright)" />
          <stop offset="100%" stopColor="var(--accent-brass-dim)" />
        </linearGradient>
      </defs>
      <path
        d="M 50 18 L 82 78 L 18 78 Z"
        fill="none"
        stroke="url(#osai-accent)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-pulse-slow' : ''}
      />
    </svg>
  );
}
