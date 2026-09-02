import { useState } from 'react';
import { X, Loader2, KeyRound, FileText } from 'lucide-react';
import { api } from '../../utils/api';

export function ImportWalletModal({ isOpen, onClose, onImported }) {
  const [mode, setMode] = useState('key'); // 'key' | 'mnemonic'
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setValue('');
    setLabel('');
    setPassword('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImport = async () => {
    if (!value.trim()) {
      setError(mode === 'key' ? 'Enter a private key' : 'Enter your seed phrase');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === 'key' ? '/wallet/import/private-key' : '/wallet/import/mnemonic';
      const body = mode === 'key'
        ? { private_key: value.trim(), password, label: label.trim() || 'Imported' }
        : { mnemonic_phrase: value.trim(), password, label: label.trim() || 'Imported' };
      const res = await api.post(endpoint, body);
      onImported?.(res.data);
      handleClose();
    } catch (e) {
      setError(e.response?.data?.detail || 'Import failed. Check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Import Wallet</h3>
          <button onClick={handleClose} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
        </div>

        <p className="text-xs text-[var(--danger)] leading-relaxed">
          Never share your private key or seed phrase with anyone else. This app encrypts it locally with the password you set below - only you can decrypt it.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => { setMode('key'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'key' ? 'bg-[var(--accent-brass)] text-black' : 'bg-white/5 border border-[var(--glass-border)] text-[var(--text-secondary)]'
            }`}
          >
            <KeyRound size={14} /> Private Key
          </button>
          <button
            onClick={() => { setMode('mnemonic'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'mnemonic' ? 'bg-[var(--accent-brass)] text-black' : 'bg-white/5 border border-[var(--glass-border)] text-[var(--text-secondary)]'
            }`}
          >
            <FileText size={14} /> Seed Phrase
          </button>
        </div>

        {mode === 'key' ? (
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Private Key</label>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input-glass w-full mt-1 font-mono text-sm"
              placeholder="0x... or 64-character hex"
              autoComplete="off"
            />
          </div>
        ) : (
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Seed Phrase</label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input-glass w-full mt-1 min-h-[80px] font-mono text-sm"
              placeholder="12 or 24 words, separated by spaces"
              autoComplete="off"
            />
          </div>
        )}

        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Label (optional)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input-glass w-full mt-1"
            placeholder="e.g. Trading Wallet"
          />
        </div>

        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Encryption Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-glass w-full mt-1"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-[var(--danger)] font-mono">{String(error)}</p>}

        <div className="flex gap-2">
          <button onClick={handleImport} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Import Wallet'}
          </button>
          <button onClick={handleClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
      </div>
    </div>
  );
}
