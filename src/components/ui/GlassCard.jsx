export function GlassCard({ children, className = '', title, value, accent }) {
  if (title && value !== undefined) {
    return (
      <div className={`ledger-card p-4 ${className}`}>
        <p className="text-[12px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-mono mt-1 ${accent ? 'text-brass' : 'text-[var(--color-text-primary)]'}`}>{value}</p>
      </div>
    );
  }
  return <div className={`ledger-card ${className}`}>{children}</div>;
}
