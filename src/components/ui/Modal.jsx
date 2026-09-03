import { useState } from 'react';
import { X } from 'lucide-react';

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  inputType = 'text', 
  inputPlaceholder = '', 
  onConfirm, 
  confirmText = 'OK', 
  cancelText = 'Cancel', 
  showInput = true,
  inputValue = '',
  onInputChange = null,
  variant = 'default',
  icon = null,
  eyebrow = '',
  securityText = ''
}) {
  const [internalValue, setInternalValue] = useState('');

  const value = onInputChange ? inputValue : internalValue;

  const handleChange = (e) => {
    const newVal = e.target.value;
    if (onInputChange) {
      onInputChange(newVal);
    } else {
      setInternalValue(newVal);
    }
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (showInput && !value.trim()) return;
    onConfirm(value);
    if (!onInputChange) setInternalValue('');
    onClose();
  };

  const handleCancel = () => {
    if (!onInputChange) setInternalValue('');
    onClose();
  };

  const premium = variant === 'transaction';

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in ${
      premium
        ? 'bg-black/75 backdrop-blur-xl'
        : 'bg-black/60 backdrop-blur-md'
    }`}>
      <div className={`relative overflow-hidden w-full max-w-md ${
        premium
          ? 'bg-[var(--bg-secondary)] border border-white/[0.08] rounded-[28px] p-5 sm:p-7 space-y-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)]'
          : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4 shadow-xl'
      }`}>

        {premium && (
          <>
            <div className="absolute -top-24 -right-20 w-48 h-48 rounded-full bg-violet-500/[0.08] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-28 -left-20 w-52 h-52 rounded-full bg-[var(--accent-brass)]/[0.05] blur-3xl pointer-events-none" />
          </>
        )}

        <div className="relative flex justify-between items-start">
          <div className="flex items-center gap-3 min-w-0">
            {premium && (
              <div className="w-11 h-11 rounded-2xl bg-violet-500/[0.10] border border-violet-400/[0.18] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}

            <div className="min-w-0">
              {premium && eyebrow && (
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">
                  {eyebrow}
                </div>
              )}
              <h3 className={`font-display font-bold text-[var(--text-primary)] ${
                premium ? 'text-xl sm:text-2xl' : 'text-xl'
              }`}>
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className={`flex items-center justify-center shrink-0 ${
              premium
                ? 'w-9 h-9 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.05] active:scale-95 transition-all duration-200'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] touch'
            }`}
            aria-label="Close"
          >
            <X size={premium ? 19 : 20} />
          </button>
        </div>

        <div className="relative">
          <p className={`text-sm leading-relaxed ${
            premium ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'
          }`}>
            {message}
          </p>
        </div>

        {premium && securityText && (
          <div className="relative flex items-center gap-2 rounded-xl border border-emerald-400/[0.12] bg-emerald-400/[0.04] px-3 py-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]" />
            <span className="text-[11px] text-emerald-200/80">
              {securityText}
            </span>
          </div>
        )}

        {showInput && (
          <div className="relative">
            {premium && (
              <label className="block mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Wallet password
              </label>
            )}
            <input
              type={inputType}
              value={value}
              onChange={handleChange}
              className={premium
                ? 'w-full min-h-12 rounded-2xl bg-white/[0.035] border border-white/[0.09] px-4 text-[var(--text-primary)] placeholder:text-white/25 outline-none transition-all duration-200 focus:border-violet-400/30 focus:ring-2 focus:ring-violet-400/10'
                : 'input-base'
              }
              placeholder={inputPlaceholder}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>
        )}

        <div className={`relative flex gap-2 ${premium ? 'pt-1' : ''}`}>
          <button
            onClick={handleConfirm}
            className={premium
              ? 'min-h-12 rounded-2xl flex-1 justify-center font-semibold transition-all duration-200 hover:-translate-y-px active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-brass)]/40'
              : 'btn-primary flex-1 justify-center'
            }
            style={premium ? { background: 'var(--accent-brass)', color: 'black' } : undefined}
          >
            {confirmText}
          </button>

          <button
            onClick={handleCancel}
            className={premium
              ? 'min-h-12 rounded-2xl px-5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.035] active:scale-[0.985] transition-all duration-200'
              : 'btn-secondary flex-1 justify-center'
            }
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
