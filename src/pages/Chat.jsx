import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Flag, Paperclip, Mic, ArrowUp, X as XIcon, Clock, FileText, Download, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ToastContainer, useToast } from '../components/ui/Toast';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003/api';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export default function Chat() {
  const { toasts, addToast, removeToast } = useToast();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [limitHit, setLimitHit] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedImage, setAttachedImage] = useState(null); // { name, dataUrl }
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Auto-grow the composer textarea with content, capped so it never
  // takes over the screen - matches the max-h-40 constraint below.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  // Only images are supported (matches the backend's VISION_MODELS
  // support - PDFs/other files aren't sent to the model). Converts to a
  // base64 data URI, which is exactly the format /chat/stream expects
  // in ChatRequest.images.
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Only image files are supported right now.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage({ name: file.name, dataUrl: reader.result });
    };
    reader.onerror = () => {
      addToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveFile = () => setAttachedImage(null);

  // Web Speech API - transcribes speech directly in the browser, no
  // backend call. Not supported in every browser (notably not in
  // Firefox as of writing) - handleMicClick checks for that and gives
  // a clear message rather than a silent no-op.
  const getSpeechRecognition = () => {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  };

  const handleMicClick = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      addToast('Voice input isn\'t supported in this browser.', 'error');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== 'aborted') {
        addToast(`Voice input error: ${event.error}`, 'error');
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Stop any in-progress recognition if the component unmounts mid-listen
  // (e.g. user navigates away while the mic is active).
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

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

  const fetchUsage = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/chat/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (e) {
      console.error('Failed to fetch usage', e);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

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

  // Downloads a generated document via an authenticated fetch (a plain
  // <a href> can't carry the Bearer token), then triggers the browser's
  // save dialog from the resulting blob.
  const downloadDocument = async (documentId, filename) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/chat/documents/${documentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      addToast('Failed to download document.', 'error');
    }
  };

  // Assistant messages for a generated document are stored (and streamed)
  // with a leading [document:id:filename] marker - see chat.py's
  // generate(). Parsing it here means both live-streamed and
  // history-loaded messages render the same document card.
  const parseDocumentMarker = (content) => {
    if (!content) return null;
    const match = content.match(/^\[document:([^:]+):([^\]]+)\]/);
    if (!match) return null;
    return { documentId: match[1], filename: match[2] };
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || loading) return;

    setLimitHit(false);
    const imageForThisMessage = attachedImage;
    const userMessage = {
      role: 'user',
      content: input,
      image: imageForThisMessage?.dataUrl || null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImage(null);
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
          images: imageForThisMessage ? [imageForThisMessage.dataUrl] : undefined,
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
        if (response.status === 429) {
          setLimitHit(true);
          fetchUsage();
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
        createdAt: new Date().toISOString(),
        generatingDocument: false,
      };
      let done = false;
      let receivedFirstChunk = false;

      setMessages(prev => [...prev, { ...assistantMessage }]);

      const pushUpdate = () => {
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
      };

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
              if (parsed.status === 'generating_document') {
                receivedFirstChunk = true;
                assistantMessage.generatingDocument = true;
                pushUpdate();
              } else if (parsed.document_ready) {
                receivedFirstChunk = true;
                assistantMessage.generatingDocument = false;
                assistantMessage.content = `[document:${parsed.document_ready.document_id}:${parsed.document_ready.filename}] Generated **${parsed.document_ready.filename}**`;
                pushUpdate();
              } else if (parsed.content) {
                receivedFirstChunk = true;
                assistantMessage.content += parsed.content;
                pushUpdate();
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

      // Backend commits the chats/chat_messages rows before it starts
      // streaming a response, so by the time we get here the sidebar's
      // recent-chats list is stale (it only fetches once on mount, never
      // on new activity). Tell it to refresh.
      window.dispatchEvent(new CustomEvent('chat-updated'));
      fetchUsage();

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
      {usage && (
        <div className="flex items-center justify-between px-4 py-2 mx-3 mt-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[9.5px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{
                background:
                  usage.tier === 'platinum' ? 'rgba(240,237,228,0.14)' :
                  usage.tier === 'gold' ? 'rgba(232,200,119,0.18)' :
                  'rgba(138,122,78,0.18)',
                color:
                  usage.tier === 'platinum' ? '#F0EDE4' :
                  usage.tier === 'gold' ? '#E8C877' :
                  '#C9A961',
              }}
            >
              {usage.tier}
            </span>
            {usage.limit != null && (
              <div className="w-[60px] h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`,
                    background: (usage.used / usage.limit) >= 1 ? 'var(--danger)' : (usage.used / usage.limit) >= 0.85 ? '#d89a3a' : 'var(--accent-brass)',
                  }}
                />
              </div>
            )}
          </div>
          {usage.limit != null ? (
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              <strong className="text-[var(--text-primary)] font-semibold">{usage.used}</strong> / {usage.limit} today
            </span>
          ) : (
            <span className="text-[10.5px] font-mono text-[var(--text-muted)]">Unlimited messages</span>
          )}
        </div>
      )}
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
          const docInfo = !isUser ? parseDocumentMarker(msg.content) : null;
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
                {!isUser && !isSystem && msg.generatingDocument ? (
                  <div className="animate-slide-up rounded-2xl px-5 py-4 flex items-center gap-2.5">
                    <Loader2 size={16} className="animate-spin text-[var(--accent-brass)]" />
                    <span className="text-sm text-[var(--text-secondary)]">Generating document...</span>
                  </div>
                ) : !isUser && !isSystem && docInfo ? (
                  <div className="animate-slide-up rounded-2xl px-4 py-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] max-w-[280px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[var(--accent-brass)]/12 text-[var(--accent-brass-bright)] flex items-center justify-center shrink-0">
                        <FileText size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] text-[var(--text-primary)] font-medium truncate">{docInfo.filename}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">Ready to download</p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadDocument(docInfo.documentId, docInfo.filename)}
                      className="btn-secondary w-full justify-center mt-3 text-[12.5px] py-1.5"
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                ) : (
                  <div
                    className={`animate-slide-up rounded-2xl px-5 py-3 ${
                      isUser
                        ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]'
                        : isSystem
                          ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300'
                          : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {isUser ? (
                      <>
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="Attached"
                            className="rounded-xl max-h-64 max-w-full mb-2 object-contain"
                          />
                        )}
                        {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                      </>
                    ) : (
                      <div className={`prose prose-sm max-w-none break-words ${theme === 'dark' ? 'prose-invert' : ''}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content || ' '}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
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

        {limitHit && (
          <div className="max-w-[90%] rounded-2xl px-4 py-3.5" style={{ background: 'rgba(193,85,74,0.08)', border: '1px solid rgba(193,85,74,0.3)' }}>
            <p className="font-display font-bold text-sm text-[var(--text-primary)] mb-1">Daily limit reached</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2.5">
              You've used all {usage?.limit} messages included in your {usage?.tier} tier today.
              Stake more CLOSE to raise your daily limit, or check back tomorrow (UTC).
            </p>
            <button
              onClick={() => navigate('/vault?tab=staking')}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg"
              style={{ background: 'linear-gradient(135deg, var(--accent-brass-bright), var(--accent-brass))', color: '#20190B' }}
            >
              <Clock size={13} /> View Staking Tiers
            </button>
          </div>
        )}

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

      <div className="p-4">
        <form onSubmit={sendMessage} className="glass-bar rounded-3xl max-w-3xl mx-auto shadow-lg">
          {attachedImage && (
            <div className="px-4 pt-3">
              <div className="relative inline-block">
                <img
                  src={attachedImage.dataUrl}
                  alt={attachedImage.name}
                  className="h-16 w-16 object-cover rounded-xl border border-[var(--glass-border)]"
                />
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute -top-1.5 -right-1.5 bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full p-0.5"
                  aria-label="Remove attached image"
                >
                  <XIcon size={12} />
                </button>
              </div>
            </div>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message OS AI..."
            rows={1}
            className="w-full bg-transparent border-none outline-none px-4 pt-3 pb-2 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none"
            style={{ minHeight: '2.5rem', maxHeight: '10rem' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            disabled={loading}
          />

          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Attach file"
                title="Attach file"
              >
                <Paperclip size={17} />
              </button>
              <button
                type="button"
                onClick={handleMicClick}
                className={`btn-glass-icon w-9 h-9 ${
                  isListening
                    ? 'text-[var(--danger)] border-[var(--danger)]/40 animate-pulse-slow'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                title="Voice input"
              >
                <Mic size={17} />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || (!input.trim() && !attachedImage)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-brass)] hover:bg-[#c4a030] text-black shadow-md hover:shadow-lg disabled:shadow-none disabled:hover:bg-[var(--accent-brass)]"
              aria-label="Send message"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
