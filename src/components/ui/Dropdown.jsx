import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Shared dropdown, replacing native <select> so options render with the
 * app's own glass/brass design tokens instead of the OS's default
 * select UI (which can't be restyled cross-browser, especially the
 * options list).
 *
 * Two variants matching the app's existing select usages:
 * - "compact": small pill trigger (e.g. Vault's currency picker)
 * - "field": full-width form field, pairs with a <label> above it
 *   (e.g. Settings' model/language pickers, input-glass style)
 */
export function Dropdown({ value, onChange, options, variant = 'field', placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // options: either ['USD', 'EUR', ...] or [{ value, label }, ...]
  const normalized = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  const selected = normalized.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const isCompact = variant === 'compact';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          isCompact
            ? 'flex items-center gap-1.5 text-[10px] font-mono uppercase bg-white/5 border border-[var(--glass-border)] rounded-lg px-2 py-1 text-[var(--text-secondary)] hover:border-[var(--glass-border-hover)] transition-colors'
            : 'input-glass w-full mt-1 flex items-center justify-between text-left'
        }
      >
        <span className={selected ? '' : 'text-[var(--text-muted)]'}>
          {selected ? selected.label : (placeholder || 'Select...')}
        </span>
        <ChevronDown size={isCompact ? 12 : 16} className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''} ${isCompact ? '' : 'ml-2'}`} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-[var(--glass-border)] shadow-xl"
          style={{
            background: 'var(--glass-bg, rgba(21,19,14,0.92))',
            backdropFilter: 'blur(16px)',
            minWidth: isCompact ? '100px' : '100%',
            right: isCompact ? 0 : 'auto',
          }}
        >
          {normalized.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-[var(--accent-brass)] text-black font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-white/5'
                } ${isCompact ? 'font-mono uppercase text-xs' : ''}`}
              >
                {opt.label}
                {isSelected && <Check size={13} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
