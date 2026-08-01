import { useState, useRef, useEffect } from 'react';
import { Send, Plus, ChevronDown, Sparkles, Mic, MicOff, ThumbsUp, Heart, Brain, Meh, Rocket } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const REACTIONS = [
  { icon: ThumbsUp, label: '👍', key: 'like' },
  { icon: Heart, label: '❤️', key: 'love' },
  { icon: Brain, label: '🧠', key: 'brain' },
  { icon: Meh, label: '🤔', key: 'think' },
  { icon: Rocket, label: '🚀', key: 'rocket' },
];

const MODELS_BY_TIER = {
  founder: ['claude-3.5-sonnet', 'gpt-4o', 'mistral-large', 'llama-3.3-70b', 'gemini-pro'],
  enterprise: ['gpt-4o', 'claude-3.5-sonnet', 'mistral-large'],
  pro: ['claude-3.5-haiku', 'gpt-4o-mini', 'mistral-small'],
  builder: ['mistral-small', 'llama-3.3-70b'],
  guest: ['llama-3.3-70b'],
};

const MODEL_DISPLAY_NAMES = {
  'claude-3.5-sonnet': 'Claude 3.5 Sonnet',
  'gpt-4o': 'GPT-4o',
  'mistral-large': 'Mistral Large',
  'llama-3.3-70b': 'Llama 3.3 70B',
  'gemini-pro': 'Gemini Pro',
  'claude-3.5-haiku': 'Claude 3.5 Haiku',
  'gpt-4o-mini': 'GPT-4o Mini',
  'mistral-small': 'Mistral Small',
};

export default function Chat() {
  const { user } = useAuth();
  const tier = user?.stake_tier || 'guest';
  const availableModels = MODELS_BY_TIER[tier] || MODELS_BY_TIER['guest'];

  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [showChatList, setShowChatList] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [reactions, setReactions] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('os-ai-selected-model') || availableModels[0] || 'llama-3.3-70b';
  });
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!availableModels.includes(selectedModel)) {
      setSelectedModel(availableModels[0] || 'llama-3.3-70b');
    }
  }, [tier, availableModels]);

  useEffect(() => {
    localStorage.setItem('os-ai-selected-model', selectedModel);
  }, [selectedModel]);

  // Voice Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInput(transcript);
            setIsListening(false);
          }
        }
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert('Voice input is not supported in this browser.');
      }
    }
  };

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
        if (res.data && res.data.length > 0 && !selectedChatId) {
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
      setSuggestions([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/chats/${selectedChatId}/messages`);
        setMessages(res.data || []);
        setSuggestions([]);
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
    setSuggestions([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to chat.');
        setSending(false);
        return;
      }

      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: messagesPayload.concat(userMessage),
          chat_id: selectedChatId || undefined,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
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
              console.error('Failed to parse stream chunk:', e);
            }
          }
        }
      }

      const res = await api.get('/chat/chats');
      setChats(res.data || []);
      if (res.data && res.data.length > 0) {
        const newChat = res.data[0];
        setSelectedChatId(newChat.id);
      }

      // Generate suggestions
      try {
        const suggestionMessages = [
          { role: 'system', content: 'Based on the user\'s last message, suggest 3 follow-up questions or actions the user might want to take. Return only the suggestions as a JSON array of strings.' },
          { role: 'user', content: text }
        ];
        const suggRes = await api.post('/chat', {
          messages: suggestionMessages,
          chat_id: selectedChatId || undefined,
          model: selectedModel,
        });
        if (suggRes.data && suggRes.data.content) {
          try {
            const parsed = JSON.parse(suggRes.data.content);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSuggestions(parsed.slice(0, 3));
            }
          } catch (e) {
            const matches = suggRes.data.content.match(/\["(.*?)"\]/s);
            if (matches) {
              const items = matches[1].split('","').map(s => s.replace(/^"|"$/g, ''));
              setSuggestions(items.slice(0, 3));
            }
          }
        }
      } catch (e) {
        setSuggestions([
          'Tell me more about that.',
          'Can you give an example?',
          'How does this apply to crypto?'
        ]);
      }

    } catch (e) {
      console.error('Send error:', e);
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

  const handleReaction = (msgIndex, reactionKey) => {
    const msgId = messages[msgIndex]?.id || `msg-${msgIndex}`;
    setReactions(prev => {
      const current = prev[msgId] || {};
      const newCount = (current[reactionKey] || 0) + 1;
      return {
        ...prev,
        [msgId]: { ...current, [reactionKey]: newCount }
      };
    });
  };

  const newChat = () => {
    setSelectedChatId(null);
    setMessages([]);
    setShowChatList(false);
    setSuggestions([]);
  };

  const selectChat = (chatId) => {
    setSelectedChatId(chatId);
    setShowChatList(false);
    setSuggestions([]);
  };

  const applySuggestion = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => send(), 100);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full w-full px-4 tablet:px-6">
      <div className="flex items-center justify-between py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <button
            onClick={newChat}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 touch transition-all hover:border-[var(--accent-indigo)]"
          >
            <Plus size={16} /> New Chat
          </button>
          <div className="relative">
            <button
              onClick={() => setShowChatList(!showChatList)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 touch transition-all"
            >
              <span className="font-mono text-[13px]">Recent</span>
              <ChevronDown size={14} className={`transition-transform ${showChatList ? 'rotate-180' : ''}`} />
            </button>
            {showChatList && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto animate-slide-up">
                {loadingChats ? (
                  <div className="p-4 text-[var(--text-muted)] text-sm">Loading...</div>
                ) : chats.length === 0 ? (
                  <div className="p-4 text-[var(--text-muted)] text-sm">No chats yet</div>
                ) : (
                  chats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => selectChat(chat.id)}
                      className={`px-4 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors text-sm ${
                        selectedChatId === chat.id ? 'bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)]' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="font-medium">{chat.title || 'New Chat'}</div>
                      <div className="text-xs text-[var(--text-muted)]">{new Date(chat.updated).toLocaleDateString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 touch transition-all"
            >
              <span className="font-mono text-[13px]">{MODEL_DISPLAY_NAMES[selectedModel] || selectedModel}</span>
              <ChevronDown size={14} className={`transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showModelDropdown && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto animate-slide-up">
                {availableModels.map(model => (
                  <div
                    key={model}
                    onClick={() => {
                      setSelectedModel(model);
                      setShowModelDropdown(false);
                    }}
                    className={`px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors text-sm ${
                      selectedModel === model ? 'bg-[var(--accent-indigo)]/10 text-[var(--accent-indigo)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {MODEL_DISPLAY_NAMES[model] || model}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-full">
            Memory: {messages.length > 5 ? 'enabled' : 'idle'}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-4">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto space-y-4">
            <div className="w-20 h-20 rounded-full bg-[var(--accent-indigo)]/10 flex items-center justify-center text-4xl">
              <Sparkles className="w-10 h-10 text-[var(--accent-indigo)]" />
            </div>
            <h2 className="text-3xl font-display font-bold text-[var(--text-primary)]">Good evening</h2>
            <p className="text-[var(--text-secondary)] text-[16px]">How can OS AI help you today?</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const msgId = m.id || `msg-${i}`;
            const msgReactions = reactions[msgId] || {};
            return (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
                <div className="max-w-[80%]">
                  <div className={m.role === 'user' ? 'message-user' : 'message-agent'}>
                    {m.loading ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--accent-indigo)] animate-pulse-soft" />
                        <span className="text-[var(--text-muted)] text-sm">Thinking… <span className="inline-block w-1 h-1 rounded-full bg-[var(--accent-indigo)] animate-pulse-soft mx-0.5"/><span className="inline-block w-1 h-1 rounded-full bg-[var(--accent-indigo)] animate-pulse-soft mx-0.5" style={{ animationDelay: "0.2s" }}/><span className="inline-block w-1 h-1 rounded-full bg-[var(--accent-indigo)] animate-pulse-soft mx-0.5" style={{ animationDelay: "0.4s" }}/></span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    )}
                  </div>
                  {!m.loading && (
                    <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {REACTIONS.map(({ icon: Icon, label, key }) => (
                        <button
                          key={key}
                          onClick={() => handleReaction(i, key)}
                          className="text-xs touch p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-0.5"
                        >
                          <Icon size={14} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
                          {msgReactions[key] > 0 && (
                            <span className="text-[10px] text-[var(--text-muted)]">{msgReactions[key]}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {suggestions.length > 0 && !sending && (
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => applySuggestion(s)}
                className="glass-card px-4 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-indigo)] transition-all touch"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border-color)] py-4 bg-[var(--bg-primary)] sticky bottom-0">
        <div className="flex items-end gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 focus-within:border-[var(--accent-indigo)] focus-within:shadow-md transition-all">
          <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
            📎
          </button>
          <button
            onClick={toggleVoiceInput}
            className={`touch p-1 rounded-lg transition-colors ${isListening ? 'text-[var(--danger)] bg-[var(--danger)]/10' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
          >
            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask OS AI…"
            className="flex-1 bg-transparent border-none outline-none resize-none text-[17px] text-[var(--text-primary)] placeholder-[var(--text-muted)] min-h-[24px] max-h-[200px] leading-relaxed"
            rows={1}
          />
          <button
            onClick={send}
            disabled={sending}
            className="bg-[var(--accent-indigo)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded-full p-2.5 touch transition-all shadow-sm hover:shadow-md"
          >
            <Send size={18} className={sending ? 'opacity-50' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
