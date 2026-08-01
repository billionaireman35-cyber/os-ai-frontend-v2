import { useState } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, message, inputType = 'text', inputPlaceholder = '', onConfirm, confirmText = 'OK', cancelText = 'Cancel', showInput = true }) {
  const [value, setValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (showInput && !value.trim()) return;
    onConfirm(value);
    setValue('');
    onClose();
  };

  const handleCancel = () => {
    setValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">{title}</h3>
          <button onClick={handleCancel} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch"><X size={20} /></button>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">{message}</p>
        {showInput && (
          <input
            type={inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input-base"
            placeholder={inputPlaceholder}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          />
        )}
        <div className="flex gap-2">
          <button onClick={handleConfirm} className="btn-primary flex-1 justify-center">{confirmText}</button>
          <button onClick={handleCancel} className="btn-secondary flex-1 justify-center">{cancelText}</button>
        </div>
      </div>
    </div>
  );
}
