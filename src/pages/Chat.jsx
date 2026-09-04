import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../components/chat/CodeBlock';
import { Copy, Check, Flag, Paperclip, Mic, ArrowUp, X as XIcon, Clock, FileText, Download, Loader2, Share2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { Dropdown } from '../components/ui/Dropdown';

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
  const [attachedText, setAttachedText] = useState(null); // { content }
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

  const PASTE_THRESHOLD = 400;

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData('text');
    if (!text || text.length < PASTE_THRESHOLD) return;
    e.preventDefault();
    setAttachedText({ content: text });
  };

  const handleRemoveText = () => setAttachedText(null);

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

  const shareMessage = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {
        // user cancelled the share sheet, or share failed - nothing to do
      }
    } else {
      // No Web Share API support (e.g. desktop browsers) - fall back to
      // copying, so the button still does something useful.
      copyToClipboard(text, 'share-fallback');
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

  const copyDocumentName = (filename) => {
    copyToClipboard(filename, `doc-${filename}`);
  };

  const shareDocument = async (documentId, filename) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/chat/documents/${documentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch document');
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
      } else {
        downloadDocument(documentId, filename);
        addToast('Sharing not supported here - downloaded instead.', 'error');
      }
    } catch (e) {
      addToast('Failed to share document.', 'error');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage && !attachedText) || loading) return;

    setLimitHit(false);
    const imageForThisMessage = attachedImage;
    const textForThisMessage = attachedText;
    const userMessage = {
      role: 'user',
      content: textForThisMessage ? `${input}\n\n${textForThisMessage.content}` : input,
      image: imageForThisMessage?.dataUrl || null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImage(null);
    setAttachedText(null);
    setLoading(true);

    // Hoisted above the try so `finally` can always clear it, even if
    // the stream throws before the drain loop below gets torn down
    // normally.
    let drainTimer = null;

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

      // Backend commits the chats/chat_messages rows before it starts
      // streaming a response, so the chat already exists in the DB the
      // moment we get a successful response here - no need to wait for
      // the stream (or the typewriter animation on top of it) to finish
      // before the sidebar's recent-chats list can show it. Moved from
      // after the full stream completed on 2026-09-02.
      window.dispatchEvent(new CustomEvent('chat-updated'));

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

      // Track whether the stream ended because the server actually said
      // [DONE], vs. the connection just breaking (network drop, mobile
      // backgrounding, a host closing an idle connection). Both look
      // identical to reader.read() (readerDone: true either way) - without
      // this flag, an interrupted stream silently looked like a normal,
      // complete response with no error shown. Added 2026-08-21.
      let receivedDoneSentinel = false;
      let receivedTruncatedSignal = false;

      // Typewriter buffer: network chunks can arrive in bursty, uneven
      // sizes (a whole sentence at once, then nothing for a beat) which
      // reads as stuttery if rendered the instant each chunk lands.
      // Content chunks go into this queue instead of straight onto the
      // message; a steady interval below drains a few characters at a
      // time onto the screen, decoupling arrival speed from display
      // speed. Added 2026-09-02.
      //
      // Drain rate is adaptive, not fixed: a flat 3 chars/16ms (~187
      // chars/sec) looked smooth for normal chunks, but a large burst
      // (fast provider sending e.g. 2000+ chars at once) took 10+
      // seconds to visually catch up even though the network had
      // already delivered everything - reading as a stall once the
      // stream itself went quiet. Scaling the per-tick amount by the
      // current backlog keeps small chunks typing at the slow, smooth
      // base pace while large backlogs drain fast enough to never fall
      // far behind real arrival time. Fixed 2026-09-03.
      let pendingText = '';
      const DRAIN_BASE_CHARS_PER_TICK = 3;
      const DRAIN_INTERVAL_MS = 16;
      const DRAIN_CATCHUP_DIVISOR = 20; // backlog / this = extra chars this tick once backlog is large
      const DRAIN_CATCHUP_THRESHOLD = 200; // backlog (chars) before catch-up scaling kicks in
      drainTimer = setInterval(() => {
        if (!pendingText) return;
        const backlog = pendingText.length;
        const take = backlog > DRAIN_CATCHUP_THRESHOLD
          ? Math.max(DRAIN_BASE_CHARS_PER_TICK, Math.ceil(backlog / DRAIN_CATCHUP_DIVISOR))
          : DRAIN_BASE_CHARS_PER_TICK;
        const chunk = pendingText.slice(0, take);
        pendingText = pendingText.slice(take);
        assistantMessage.content += chunk;
        pushUpdate();
      }, DRAIN_INTERVAL_MS);
      const waitForDrain = () => new Promise((resolve) => {
        const check = () => {
          if (!pendingText) { resolve(); return; }
          setTimeout(check, DRAIN_INTERVAL_MS);
        };
        check();
      });

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) { done = true; break; }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') { done = true; receivedDoneSentinel = true; break; }
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
                pendingText += parsed.content;
              } else if (parsed.truncated) {
                receivedTruncatedSignal = true;
              }
            } catch (e) {}
          }
        }
      }

      // Stop draining on the interval and let any text still queued
      // finish rendering before deciding the message is complete - the
      // network stream can finish well before the typewriter effect has
      // caught up to it.
      clearInterval(drainTimer);
      await waitForDrain();

      if (!receivedFirstChunk && assistantMessage.content === '') {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && last.id === assistantMessage.id) {
            updated[updated.length - 1] = { ...last, content: 'No response received.' };
          }
          return updated;
        });
      } else if (!receivedDoneSentinel) {
        // Stream ended without the server's own [DONE] marker - the
        // connection was interrupted partway through, not a real
        // completion. Mark it visibly instead of pretending the partial
        // content is the full answer.
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && last.id === assistantMessage.id) {
            updated[updated.length - 1] = {
              ...last,
              interrupted: true,
              content: last.content + '\n\n⚠️ *Response was interrupted - connection dropped before it finished.*',
            };
          }
          return updated;
        });
      } else if (receivedTruncatedSignal) {
        // Stream completed normally ([DONE] received), but the model hit
        // its response length limit mid-answer - different from a dropped
        // connection, so it gets its own message rather than being shown
        // as either a clean success or the connection-drop warning above.
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && last.id === assistantMessage.id) {
            updated[updated.length - 1] = {
              ...last,
              truncated: true,
              content: last.content + '\n\n⚠️ *Response was cut off - it hit the length limit before finishing. Try asking for it in parts, or ask to continue.*',
            };
          }
          return updated;
        });
      }

      fetchUsage();

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Error: ' + error.message, createdAt: new Date().toISOString() }
      ]);
    } finally {
      if (drainTimer) clearInterval(drainTimer);
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
        <div className="flex items-center justify-between px-4 py-2 mx-3 mt-2.5 max-w-3xl lg:mx-auto rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-md shrink-0">
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
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto w-full space-y-6 sm:space-y-8">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="relative mb-7">
              <div className="absolute inset-0 blur-2xl opacity-20 bg-[var(--accent-brass-bright)] rounded-full scale-150" />
              <div className="relative w-16 h-16 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl flex items-center justify-center shadow-xl">
                <span className="text-3xl font-light text-[var(--accent-brass-bright)]">✦</span>
              </div>
            </div>

            <p className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--text-primary)]">
              {getGreeting()}
            </p>

            <p className="mt-3 text-base text-[var(--text-muted)] max-w-md leading-relaxed">
              Your intelligent workspace is ready.
              <br className="hidden sm:block" />
              Ask anything, build something, or explore an idea.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-lg">
              {[
                {
                  title: 'Research',
                  text: 'Understand a topic deeply',
                  prompt: 'Research '
                },
                {
                  title: 'Build',
                  text: 'Create, code, or solve',
                  prompt: 'Code '
                },
                {
                  title: 'Explore',
                  text: 'Discover ideas and possibilities',
                  prompt: 'Explore '
                },
                {
                  title: 'Just ask',
                  text: 'Start with anything',
                  prompt: ''
                }
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    setInput(item.prompt)
                    setTimeout(() => inputRef.current?.focus(), 0)
                  }}
                  className="group text-left rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/45 hover:bg-[var(--bg-secondary)]/75 hover:border-[var(--accent-brass)]/30 backdrop-blur-xl p-4 transition-all duration-200"
                >
                  <div className="flex items-center justify-between px-1 pt-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {item.title}
                    </span>
                    <ArrowUp
                      size={14}
                      className="opacity-30 group-hover:opacity-80 group-hover:-translate-y-0.5 transition-all"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {item.text}
                  </p>
                </button>
              ))}
            </div>
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
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-[var(--text-muted)]">
                    <span className="font-medium text-[var(--accent-brass-bright)]">OS AI</span>
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
                    <div className="flex gap-1.5 mt-3">
                      <button
                        onClick={() => downloadDocument(docInfo.documentId, docInfo.filename)}
                        className="btn-secondary flex-1 justify-center text-[12.5px] py-1.5"
                      >
                        <Download size={13} /> Download
                      </button>
                      <button
                        onClick={() => copyDocumentName(docInfo.filename)}
                        className="btn-glass-icon hover:bg-[var(--bg-tertiary)]/70 transition-colors w-8 h-8 shrink-0"
                        aria-label="Copy filename"
                        title="Copy filename"
                      >
                        {copiedId === `doc-${docInfo.filename}` ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => shareDocument(docInfo.documentId, docInfo.filename)}
                        className="btn-glass-icon hover:bg-[var(--bg-tertiary)]/70 transition-colors w-8 h-8 shrink-0"
                        aria-label="Share document"
                        title="Share"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
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
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const value = String(children).replace(/\n$/, '');
                              if (inline) {
                                return <code className={className} {...props}>{children}</code>;
                              }
                              return <CodeBlock language={match ? match[1] : undefined} value={value} />;
                            },
                          }}
                        >
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
                      className="text-sm bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border-color)] hover:border-[var(--accent-brass-bright)] transition"
                    >
                      {emoji} {users.length}
                    </button>
                  ))}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msgId, emoji)}
                        className="text-sm bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border-color)] hover:border-[var(--accent-brass-bright)] transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <button
                    onClick={() => copyToClipboard(msg.content, msgId)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
                    aria-label="Copy message"
                  >
                    {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                  {!isUser && !isSystem && (
                    <button
                      onClick={() => shareMessage(msg.content)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
                      aria-label="Share message"
                    >
                      <Share2 size={14} />
                    </button>
                  )}
                  {!isUser && !isSystem && (
                    <>
                      <button
                        onClick={() => setReportingMessageId(msgId)}
                        className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-red-400 p-1 rounded"
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
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {reportingMessageId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setReportingMessageId(null)}>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Report this response</h3>
            <p className="text-[var(--text-secondary)] text-sm">Help us review potentially problematic AI-generated content.</p>
            <Dropdown
              value={reportReason}
              onChange={setReportReason}
              placeholder="Select a reason..."
              options={[
                { value: 'inappropriate', label: 'Inappropriate content' },
                { value: 'harmful', label: 'Harmful or dangerous' },
                { value: 'misinformation', label: 'Misinformation' },
                { value: 'other', label: 'Other' },
              ]}
            />
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
        <form onSubmit={sendMessage} className="relative glass-bar rounded-[24px] sm:rounded-[28px] max-w-3xl mx-auto shadow-2xl border border-[var(--border-color)]/70 backdrop-blur-2xl overflow-hidden transition-all duration-200 focus-within:border-[var(--accent-brass)]/40 focus-within:shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
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

          {attachedText && (
            <div className="px-4 pt-3">
              <div className="flex items-center gap-2.5 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 max-w-[220px]">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-brass)]/15 text-[var(--accent-brass-bright)] flex items-center justify-center shrink-0 text-[10px] font-mono font-bold">
                  TXT
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-[var(--text-primary)] font-medium truncate">Pasted content</p>
                  <p className="text-[10.5px] text-[var(--text-muted)]">{attachedText.content.length.toLocaleString()} characters</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveText}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
                  aria-label="Remove pasted content"
                >
                  <XIcon size={14} />
                </button>
              </div>
            </div>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            placeholder="Ask OS AI anything..."
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
                className="btn-glass-icon hover:bg-[var(--bg-tertiary)]/70 transition-colors w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Attach file"
                title="Attach file"
              >
                <Paperclip size={17} />
              </button>
              <button
                type="button"
                onClick={handleMicClick}
                className={`btn-glass-icon hover:bg-[var(--bg-tertiary)]/70 transition-colors w-9 h-9 ${
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
              disabled={loading || (!input.trim() && !attachedImage && !attachedText)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-brass)] hover:bg-[var(--accent-brass-dim)] text-black shadow-md hover:shadow-lg disabled:shadow-none disabled:hover:bg-[var(--accent-brass)]"
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
