import { useState, useEffect, useRef } from 'react';
import { Send, Fingerprint, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';

function IntentCard({ intent }) {
  const [status, setStatus] = useState('ready');
  const [hash, setHash] = useState(null);

  const confirm = async () => {
    setStatus('signing');
    try {
      const res = await api.post('/wallet/execute', { intent_id: intent.id });
      setHash(res.data.tx_hash);
      setStatus('done');
    } catch (e) {
      setStatus('ready');
    }
  };

  return (
    <div className="mt-2 w-full max-w-md ledger-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-line">
        <span className="text-[10px] font-mono tracking-[0.14em] text-muted uppercase">
          Transaction Intent
        </span>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            status === 'done' ? 'bg-teal/15 text-teal' : 'bg-brass/15 text-brass'
          }`}
        >
          {status === 'ready' ? 'AWAITING' : status === 'signing' ? 'SIGNING' : 'SETTLED'}
        </span>
      </div>
      <div className="px-4 py-3 space-y-1.5 text-[13px]">
        <div className="flex justify-between">
          <span className="text-muted">Action</span>
          <span className="text-bone">{intent.action}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Route</span>
          <span className="font-mono text-bone">{intent.route}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Gas</span>
          <span className="font-mono text-bone">{intent.gas}</span>
        </div>
      </div>
      <div className="px-4 pb-3">
        {status === 'ready' && (
          <button
            onClick={confirm}
            className="w-full flex items-center justify-center gap-2 bg-brass hover:bg-brassLight text-void text-[13px] font-semibold rounded-md py-2 press-soft"
          >
            <Fingerprint size={14} /> Confirm & sign
          </button>
        )}
        {status === 'signing' && (
          <div className="text-[11px] text-brass font-mono flex items-center gap-2 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brass animate-ping" /> collecting signatures…
          </div>
        )}
        {status === 'done' && (
          <div className="flex justify-between text-[11px] font-mono py-1.5">
            <span className="text-teal flex items-center gap-1">
              <CheckCircle2 size={13} /> settled
            </span>
            <span className="text-muted">{hash}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'agent', text: "OS AI online. Ask me to check balances, swap, stake, or send." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: 'user', text }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const res = await api.post('/chat', { messages: next, chat_id: `chat_${Date.now()}` });
      if (res.data.type === 'transaction') {
        setMessages((m) => [
          ...m,
          { role: 'agent', text: res.data.message },
          { role: 'intent', intent: res.data.tx_intent },
        ]);
      } else {
        setMessages((m) => [...m, { role: 'agent', text: res.data.content }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'agent', text: 'Sorry, something went wrong reaching the server.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 tablet:px-6 py-5 space-y-3">
        {messages.map((m, i) =>
          m.role === 'intent' ? (
            <IntentCard key={i} intent={m.intent} />
          ) : (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] tablet:max-w-[70%] rounded-lg px-3.5 py-2 text-[14px] leading-relaxed ${
                  m.role === 'user' ? 'bg-brass text-void font-medium' : 'ledger-card text-bone px-4 py-3'
                }`}
              >
                {m.text}
              </div>
            </div>
          )
        )}
      </div>
      <div className="border-t border-line px-3 tablet:px-4 py-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask OS AI…"
          className="flex-1 bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone placeholder-muted focus:outline-none focus:border-brass"
        />
        <button
          onClick={send}
          disabled={sending}
          className="bg-brass hover:bg-brassLight disabled:opacity-50 text-void rounded-md p-2.5 press-soft touch-target"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
