import { useState, useRef, useEffect } from 'react';
import { Send, Fingerprint, CheckCircle2, Plus, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';
import { signBurn, signSend, broadcastTx } from '../utils/ethers';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function IntentCard({ intent, onConfirm }) {
  const [status, setStatus] = useState('ready');
  const [hash, setHash] = useState(null);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setStatus('signing');
    setError(null);
    try {
      const seedRes = await api.get('/wallet/seed');
      const encryptedSeed = seedRes.data.encrypted_seed;

      const password = prompt('Enter your wallet password to sign this transaction:');
      if (!password) {
        setStatus('ready');
        return;
      }

      let signedTx;
      let chain = intent.chain || 'polygon';

      if (intent.action === 'send') {
        const tokenAddress = intent.token === 'CLOSE' ? intent.contract : null;
        signedTx = await signSend(
          encryptedSeed,
          password,
          intent.to_address,
          intent.amount,
          intent.tokenAddress || null,
          chain
        );
      } else if (intent.action === 'burn') {
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

      const broadcastRes = await broadcastTx(signedTx, chain);
      setHash(broadcastRes.tx_hash);
      setStatus('done');
      if (onConfirm) onConfirm(broadcastRes.tx_hash);
    } catch (e) {
      setError(e.message || 'Transaction failed');
      setStatus('ready');
    }
  };

  return (
    <div className="mt-2 w-full max-w-md ledger-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-line)]">
        <span className="text-[10px] font-mono tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
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
          <span className="text-[var(--color-text-muted)]">Action</span>
          <span className="text-[var(--color-text-primary)]">{intent.action}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-muted)]">Route</span>
          <span className="font-mono text-[var(--color-text-primary)]">{intent.chain || 'polygon'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-muted)]">Amount</span>
          <span className="font-mono text-[var(--color-text-primary)]">{intent.amount} {intent.token || 'CLOSE'}</span>
        </div>
        {intent.to_address && (
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">To</span>
            <span className="font-mono text-[var(--color-text-primary)] text-xs truncate max-w-[120px]">{intent.to_address}</span>
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
              <span className="text-[var(--color-text-muted)] truncate max-w-[150px]">{hash}</span>
            </div>
          </div>
        )}
        {error && (
          <div className="text-[11px] text-[var(--color-danger)] font-mono py-1.5">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [showChatList, setShowChatList] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await api.get('/chat/chats');
        setChats(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedChatId(res.data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch chats:', e);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/chats/${selectedChatId}/messages`);
        setMessages(res.data || []);
      } catch (e) {
        console.error('Failed to fetch messages:', e);
        setMessages([]);
      }
    };
    fetchMessages();
  }, [selectedChatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const messagesPayload = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    const userMessage = { role: 'user', content: text };
    const newMessages = [...messagesPayload, userMessage];
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setSending(true);

    const aiMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', loading: true }]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to chat.');
        setSending(false);
        return;
      }

      const chatId = selectedChatId || `chat_${Date.now()}`;
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: messagesPayload.concat(userMessage),
          chat_id: chatId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      setMessages(prev => {
        const updated = [...prev];
        if (updated[aiMessageIndex]) {
          updated[aiMessageIndex] = { ...updated[aiMessageIndex], loading: false };
        }
        return updated;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6);
            if (payload === '[DONE]') continue;
            try {
              const data = JSON.parse(payload);
              const content = data.content || '';
              if (content) {
                fullText += content;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[aiMessageIndex]) {
                    updated[aiMessageIndex] = { ...updated[aiMessageIndex], content: fullText };
                  }
                  return updated;
                });
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }

      if (!selectedChatId) {
        const res = await api.get('/chat/chats');
        setChats(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedChatId(res.data[0].id);
        }
      } else {
        setChats(prevChats => {
          const updated = prevChats.map(c =>
            c.id === selectedChatId ? { ...c, updated: new Date().toISOString() } : c
          );
          return updated.sort((a, b) => new Date(b.updated) - new Date(a.updated));
        });
      }
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        if (updated[aiMessageIndex]) {
          updated[aiMessageIndex] = { ...updated[aiMessageIndex], content: '⚠️ Failed to stream response.' };
        }
        return updated;
      });
    } finally {
      setSending(false);
    }
  };

  const newChat = () => {
    setSelectedChatId(null);
    setMessages([]);
    setShowChatList(false);
  };

  const selectChat = (chatId) => {
    setSelectedChatId(chatId);
    setShowChatList(false);
  };

  return (
    <div className="flex flex-col h-full max-w-[800px] mx-auto w-full px-4 tablet:px-6">
      <div className="flex items-center justify-between py-3 border-b border-[var(--color-line)]">
        <div className="flex items-center gap-2">
          <button
            onClick={newChat}
            className="flex items-center gap-1 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-1.5"
          >
            <Plus size={14} /> New Chat
          </button>
          <div className="relative">
            <button
              onClick={() => setShowChatList(!showChatList)}
              className="flex items-center gap-1 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-2 py-1.5"
            >
              Recent <ChevronDown size={12} />
            </button>
            {showChatList && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-[var(--color-panel2)] border border-[var(--color-line)] rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {loadingChats ? (
                  <div className="p-2 text-[var(--color-text-muted)] text-[11px]">Loading...</div>
                ) : chats.length === 0 ? (
                  <div className="p-2 text-[var(--color-text-muted)] text-[11px]">No chats yet</div>
                ) : (
                  chats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => selectChat(chat.id)}
                      className={`p-2 cursor-pointer hover:bg-white/5 text-[12px] ${selectedChatId === chat.id ? 'bg-brass/10 text-brass' : 'text-[var(--color-text-primary)]'}`}
                    >
                      {chat.title || 'New Chat'}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-xs text-[var(--color-text-muted)] font-mono">Memory: {messages.length > 5 ? 'enabled' : 'idle'}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-3xl font-display text-[var(--color-text-primary)]">Good evening</h2>
            <p className="text-[var(--color-text-muted)] mt-2 text-[15px]">How can OS AI help you today?</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] tablet:max-w-[70%] rounded-lg px-4 py-2.5 text-[14px] leading-relaxed ${
                  m.role === 'user' ? 'bg-brass text-void font-medium' : 'ledger-card text-[var(--color-text-primary)] px-4 py-3'
                }`}
              >
                {m.loading ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-brass animate-pulse" />
                    <span className="text-[var(--color-text-muted)] text-[13px]">Thinking…</span>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[var(--color-line)] py-4">
        <div className="flex items-end gap-2 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl px-3 py-2 focus-within:border-brass transition-colors">
          <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] touch-target">
            📎
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask OS AI…"
            className="flex-1 bg-transparent border-none outline-none resize-none text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] min-h-[24px] max-h-[200px]"
            rows={1}
          />
          <button
            onClick={send}
            disabled={sending}
            className="bg-brass hover:bg-brassLight disabled:opacity-50 text-void rounded-full p-2 press-soft touch-target"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
