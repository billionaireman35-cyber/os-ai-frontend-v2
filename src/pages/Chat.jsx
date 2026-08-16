import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Flag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003/api';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export default function Chat() {
  const { addToast } = useToast();
  const { theme } = useTheme();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Restore whichever chat the Sidebar last selected (survives remounts
  // caused by navigating to another route and back).
  useEffect(() => {
    const stored = localStorage.getItem('os-ai-selected-chat');
    if (stored) setChatId(stored);
  }, []);

  // Load that chat's messages whenever chatId changes.
  useEffect(() => {
    if (chatId) {
      refreshMessages();
    } else {
      setMessages([]);
    }
  }, [chatId]);

  // "New Chat" in the sidebar clears the selection even when we're
  // already on this route (no navigation occurs in that case).
  useEffect(() => {
    const handleNewChat = () => {
      localStorage.removeItem('os-ai-selected-chat');
      setChatId(null);
      setMessages([]);
    };
    window.addEventListener('new-chat', handleNewChat);
    return () => window.removeEventListener('new-chat', handleNewChat);
  }, []);

  // Quick Action buttons in the sidebar (Research/Coding/Crypto/Everyday)
  // dispatch this to prefill the composer with a mode prefix.
  useEffect(() => {
    const handleQuickAction = (e) => {
      const promptMap = {
        research: 'Research: ',
        coding: 'Code: ',
        crypto: 'Crypto: ',
        everyday: 'Everyday: '
      };
      setInput(promptMap[e.detail?.mode] || '');
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener('quick-action', handleQuickAction);
    return () => window.removeEventListener('quick-action', handleQuickAction);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode) {
      const promptMap = {
        research: 'Research: ',
        coding: 'Code: ',
        crypto: 'Crypto: ',
        everyday: 'Everyday: '
      };
      const prefix = promptMap[mode] || '';
      setInput(prefix);
      window.history.replaceState({}, document.title, '/');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [location]);

  const getToken = () => localStorage.getItem('token');

  const refreshMessages = async () => {
    if (!chatId) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/chat/chats/${chatId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to refresh messages', e);
    }
  };

  const copyToClipboard = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(() => fallbackCopy(text, id));
    } else {
      fallbackCopy(text, id);
    }
  };

  const fallbackCopy = (text, id) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // ✅ Build messages array including the new user message
      const messagesToSend = [...messages, userMessage];

      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: messagesToSend.map(m => ({ role: m.role, content: m.content })),
          chat_id: chatId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402 && errorData.content) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: errorData.content, model: 'system', createdAt: new Date().toISOString() }
          ]);
          setLoading(false);
          return;
        }
        throw new Error(errorData.detail || errorData.content || 'Chat request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = {
        role: 'assistant',
        content: '',
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      let done = false;
      let receivedFirstChunk = false;

      setMessages(prev => [...prev, { ...assistantMessage }]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) { done = true; break; }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') { done = true; break; }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                receivedFirstChunk = true;
                assistantMessage.content += parsed.content;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'assistant' && last.id === assistantMessage.id) {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...assistantMessage };
                    return updated;
                  } else {
                    return [...prev, { ...assistantMessage }];
                  }
                });
              }
            } catch (e) {}
          }
        }
      }

      if (!receivedFirstChunk && assistantMessage.content === '') {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && last.id === assistantMessage.id) {
            updated[updated.length - 1] = { ...last, content: 'No response received.' };
          }
          return updated;
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Error: ' + error.message, createdAt: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [reportingMessageId, setReportingMessageId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const submitReport = async () => {
    if (!reportReason) {
      addToast('Please select a reason', 'error');
      return;
    }
    setReportSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/chat/messages/${reportingMessageId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: reportReason, details: reportDetails })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Request failed (${res.status})`);
      }
      addToast('Report submitted. Thank you.', 'success');
      setReportingMessageId(null);
      setReportReason('');
      setReportDetails('');
    } catch (e) {
      addToast('Failed to submit report', 'error');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ emoji })
      });
      if (res.ok) refreshMessages();
    } catch (e) {
      console.error('Reaction error:', e);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6">
              <span className="text-5xl font-light text-[#d4af37]">✦</span>
            </div>
            <p className="text-2xl font-light text-[var(--text-primary)]/80">{getGreeting()}</p>
            <p className="text-sm max-w-sm mt-2 text-[var(--text-muted)]">
              I'm OS AI. How can I help you today?
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'assistant' && msg.model === 'system';
          const msgId = msg.id || `msg-${idx}`;
          const isCopied = copiedId === msgId;
          const timestamp = msg.createdAt || msg.created || Date.now();
          const reactions = msg.reactions || {};

          return (
            <div
              key={idx}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
            >
              <div className={`max-w-[80%] relative ${isUser ? 'order-2' : 'order-1'}`}>
                {!isUser && !isSystem && (
                  <div className="flex items-center gap-2 mb-1 text-xs text-[var(--text-muted)]">
                    <span className="font-medium text-[#d4af37]">OS AI</span>
                    <span>{formatTime(timestamp)}</span>
                    {msg.model && <span className="text-[var(--text-muted)] opacity-60">• {msg.model}</span>}
                  </div>
                )}
                <div
                  className={`animate-slide-up rounded-2xl px-5 py-3 shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-black'
                      : isSystem
                        ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300'
                        : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  ) : (
                    <div className={`prose prose-sm max-w-none break-words ${theme === 'dark' ? 'prose-invert' : ''}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content || ' '}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(reactions).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(msgId, emoji)}
                      className="text-sm bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border-color)] hover:border-[#d4af37] transition"
                    >
                      {emoji} {users.length}
                    </button>
                  ))}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msgId, emoji)}
                        className="text-sm bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border-color)] hover:border-[#d4af37] transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <button
                    onClick={() => copyToClipboard(msg.content, msgId)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
                    aria-label="Copy message"
                  >
                    {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                  {!isUser && !isSystem && (
                    <>
                      <button
                        onClick={() => setReportingMessageId(msgId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-red-400 p-1 rounded"
                        aria-label="Report this response"
                        title="Report this response"
                      >
                        <Flag size={14} />
                      </button>
                      <span className="text-[10px] text-[var(--text-muted)] opacity-60">• {msg.model || 'AI'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl px-5 py-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {reportingMessageId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setReportingMessageId(null)}>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Report this response</h3>
            <p className="text-[var(--text-secondary)] text-sm">Help us review potentially problematic AI-generated content.</p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="input-base w-full"
            >
              <option value="">Select a reason...</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="harmful">Harmful or dangerous</option>
              <option value="misinformation">Misinformation</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="input-base w-full resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={submitReport}
                disabled={reportSubmitting}
                className="btn-primary flex-1 justify-center disabled:opacity-50"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                onClick={() => setReportingMessageId(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={sendMessage} className="border-t border-[var(--border-color)] p-4 bg-[var(--bg-secondary)] flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 resize-none transition"
            style={{ minHeight: '3rem', maxHeight: '10rem' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-[#d4af37] hover:bg-[#c4a030] disabled:opacity-50 text-black font-medium px-6 py-2.5 rounded-2xl transition flex-shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
