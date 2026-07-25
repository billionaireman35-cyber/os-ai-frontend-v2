export function GlassCard({ children, className = '', title, value }) {
  if (title && value !== undefined) {
    return (
      <div className={`glass-soft p-4 ${className}`}>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    );
  }
  return <div className={`glass-soft ${className}`}>{children}</div>;
}
