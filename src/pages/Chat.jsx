import { useState, useRef } from 'react';
import { Send, Fingerprint, CheckCircle2, Plus } from 'lucide-react';
import { api } from '../utils/api';
import { signBurn, signSend, broadcastTx } from '../utils/ethers';

function IntentCard({ intent, onConfirm }) {
  const [status, setStatus] = useState('ready');
  const [hash, setHash] = useState(null);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setStatus('signing');
    setError(null);
    try {
      // Fetch encrypted seed from backend
      const seedRes = await api.get('/wallet/seed');
      const encryptedSeed = seedRes.data.encrypted_seed;

      // Prompt for password
      const password = prompt('Enter your wallet password to sign this transaction:');
      if (!password) {
        setStatus('ready');
        return;
      }

      let signedTx;
      let chain = intent.chain || 'polygon';

      if (intent.action === 'send') {
        // Send tokens
        const tokenAddress = intent.token === 'CLOSE' ? intent.contract : null; // we need to pass token address
        // For now, we assume intent includes tokenAddress
        signedTx = await signSend(
          encryptedSeed,
          password,
          intent.to_address,
          intent.amount,
          intent.tokenAddress || null,
          chain
        );
      } else if (intent.action === 'burn') {
        // Burn CLOSE
        const contractAddress = intent.contract || import.meta.env.VITE_CLOSE_CONTRACT;
        signedTx = await signBurn(
          encryptedSeed,
          password,
          contractAddress,
          intent.amount,
          chain
        );
      } else {
        throw new Error('Unsupported action');
      }

      // Broadcast
      const broadcastRes = await broadcastTx(signedTx, chain);
      setHash(broadcastRes.tx_hash);
      setStatus('done');
      onConfirm?.(broadcastRes.tx_hash);
    } catch (e) {
      setError(e.message || 'Transaction failed');
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
          <span className="font-mono text-bone">{intent.chain || 'polygon'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Amount</span>
          <span className="font-mono text-bone">{intent.amount} {intent.token || 'CLOSE'}</span>
        </div>
        {intent.to_address && (
          <div className="flex justify-between">
            <span className="text-muted">To</span>
            <span className="font-mono text-bone text-xs truncate max-w-[120px]">{intent.to_address}</span>
          </div>
        )}
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
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono py-1.5">
              <span className="text-teal flex items-center gap-1">
                <CheckCircle2 size={13} /> settled
              </span>
              <span className="text-muted truncate max-w-[150px]">{hash}</span>
            </div>
          </div>
        )}
        {error && (
          <div className="text-[11px] text-alert font-mono py-1.5">
            ❌ {error}
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
        // The backend returns a transaction intent
        // We'll add it as an intent card
        setMessages((m) => [
          ...m,
          { role: 'agent', text: res.data.message },
          { role: 'intent', intent: res.data.tx_intent },
        ]);
      } else {
        setMessages((m) => [...m, { role: 'agent', text: res.data.content }]);
        // If the response contains a burn_payload, we handle it automatically
        if (res.data.burn_payload) {
          // The backend expects automatic burn after AI response.
          // We'll trigger the burn confirmation directly.
          // We'll create a new intent card for the burn.
          const burnIntent = {
            action: 'burn',
            amount: res.data.burn_payload.amount,
            token: 'CLOSE',
            chain: res.data.burn_payload.chain,
            contract: res.data.burn_payload.contract,
          };
          setMessages((m) => [
            ...m,
            { role: 'agent', text: 'A burn transaction is required to continue.' },
            { role: 'intent', intent: burnIntent },
          ]);
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'agent', text: 'Sorry, something went wrong reaching the server.' }]);
    } finally {
      setSending(false);
    }
  };

  const newChat = () => {
    setMessages([
      { role: 'agent', text: "OS AI online. Ask me to check balances, swap, stake, or send." },
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-line">
        <div className="flex gap-2">
          <button
            onClick={newChat}
            className="flex items-center gap-1 text-xs font-mono text-muted hover:text-bone bg-panel border border-line rounded-md px-3 py-1.5"
          >
            <Plus size={14} /> New Chat
          </button>
        </div>
        <div className="flex gap-2">
          <span className="text-xs text-muted font-mono">Memory: {messages.length > 5 ? 'enabled' : 'idle'}</span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 tablet:px-6 py-5 space-y-3">
        {messages.map((m, i) =>
          m.role === 'intent' ? (
            <IntentCard
              key={i}
              intent={m.intent}
              onConfirm={(txHash) => {
                // Optionally update the message with the tx hash
                setMessages((prev) =>
                  prev.map((msg, idx) =>
                    idx === i ? { ...msg, settled: true, txHash } : msg
                  )
                );
              }}
            />
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