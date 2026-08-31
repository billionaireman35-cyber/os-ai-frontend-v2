import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {}
      document.body.removeChild(textarea);
    });
  };

  return (
    <div className="relative rounded-xl overflow-hidden my-2 border border-[var(--border-color)]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
        <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-400" /> Copied
            </>
          ) : (
            <>
              <Copy size={12} /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="m-0 p-3 overflow-x-auto text-[13px] bg-[var(--bg-secondary)]">
        <code className="font-mono text-[var(--text-primary)]">{value}</code>
      </pre>
    </div>
  );
}
