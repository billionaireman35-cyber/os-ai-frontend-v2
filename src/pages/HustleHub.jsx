import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import { Modal } from '../components/ui/Modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../components/chat/CodeBlock';
import {
  Plus, Users, MessageSquare, X, Send, Copy, CheckCircle, LogIn, UserPlus,
  Lock, Globe, Check, XCircle, Loader2, Search, UserMinus, LogOut,
  Pencil, Trash2, Compass, Sparkles,
} from 'lucide-react';

const CLOSE_TOKEN_ADDRESS = '0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8';
const TREASURY_ADDRESS = '0x5bD39AD3e8B1CB01e7385958160FD9b2675D02d1';
const WORKSPACE_CREATE_COST = 5000;
const WORKSPACE_JOIN_COST = 6000;

export default function HustleHub() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [newWorkspaceVisibility, setNewWorkspaceVisibility] = useState('private');
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createStep, setCreateStep] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinStatus, setJoinStatus] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingRequestsExpanded, setPendingRequestsExpanded] = useState(false);
  const [canManageRequests, setCanManageRequests] = useState(false);
  const [requestActionError, setRequestActionError] = useState('');
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [approveStep, setApproveStep] = useState('');
  const [approveTxHash, setApproveTxHash] = useState('');

  // Self-service join payment: after /workspace/join returns "pending",
  // this holds the workspace to pay into. Replaces the old flow of
  // messaging the admin your tx hash - the requester pays and submits
  // their own hash directly.
  const [pendingJoin, setPendingJoin] = useState(null); // { workspace_id, workspace_name }
  const [showJoinPayment, setShowJoinPayment] = useState(false);
  const [joinPayStep, setJoinPayStep] = useState('');
  const [joinPayError, setJoinPayError] = useState('');

  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [showDiscover, setShowDiscover] = useState(false);
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  // Tracks whether the user was already scrolled near the bottom right
  // before this messages update landed - only auto-scroll in that case.
  // Without this, reading up through history got yanked back down every
  // ~2s poll cycle (or whenever a new/AI message arrived), since the
  // effect below ran unconditionally on every messages change.
  const wasNearBottomRef = useRef(true);
  const NEAR_BOTTOM_THRESHOLD_PX = 120;

  const isOwner = selectedWorkspace && user && selectedWorkspace.owner_id === user.id;

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workspace/list');
      setWorkspaces(res.data || []);
      if (res.data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(res.data[0]);
      }
    } catch (e) {
      console.error('Failed to fetch workspaces', e);
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (workspaceId) => {
    if (!workspaceId) return;
    try {
      const res = await api.get(`/workspace/${workspaceId}/messages`);
      setMessages(res.data || []);
    } catch (e) {
      console.error('Failed to fetch messages', e);
      setMessages([]);
    }
  };

  const fetchPendingRequests = async (workspaceId) => {
    if (!workspaceId) return;
    try {
      const res = await api.get(`/workspace/${workspaceId}/requests`);
      setPendingRequests(res.data || []);
      setCanManageRequests(true);
    } catch (e) {
      setPendingRequests([]);
      setCanManageRequests(false);
    }
  };

  const fetchMembers = async (workspaceId) => {
    if (!workspaceId) return;
    setMembersLoading(true);
    try {
      const res = await api.get(`/workspace/${workspaceId}/members`);
      setMembers(res.data || []);
    } catch (e) {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchDiscover = async () => {
    setDiscoverLoading(true);
    try {
      const res = await api.get('/workspace/discover', { params: { query: discoverQuery } });
      setDiscoverResults(res.data || []);
    } catch (e) {
      setDiscoverResults([]);
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchMessages(selectedWorkspace.id);
      fetchPendingRequests(selectedWorkspace.id);
      fetchMembers(selectedWorkspace.id);
      setRequestActionError('');
      // Faster polling than before (was 5s/10s) for a livelier feel.
      const msgInterval = setInterval(() => fetchMessages(selectedWorkspace.id), 2000);
      const reqInterval = setInterval(() => fetchPendingRequests(selectedWorkspace.id), 4000);
      return () => {
        clearInterval(msgInterval);
        clearInterval(reqInterval);
      };
    } else {
      setPendingRequests([]);
      setCanManageRequests(false);
      setMembers([]);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    if (wasNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    wasNearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX;
  };

  // Automatically open the request panel when pending requests arrive.
  useEffect(() => {
    if (pendingRequests.length > 0) {
      setPendingRequestsExpanded(true);
    }
  }, [pendingRequests.length]);

  // Reset to "following the bottom" whenever the selected hub changes,
  // so switching into a hub always starts scrolled to the latest message.
  useEffect(() => {
    wasNearBottomRef.current = true;
  }, [selectedWorkspace?.id]);

  useEffect(() => {
    if (showDiscover) fetchDiscover();
  }, [showDiscover]);

  const payTreasury = async (amount, password) => {
    const res = await api.post('/wallet/send', {
      chain: 'polygon',
      to_address: TREASURY_ADDRESS,
      amount_wei: (amount * 1e18).toString(),
      password,
      token_address: CLOSE_TOKEN_ADDRESS,
    });
    return res.data.tx_hash;
  };

  const CREATE_RETRY_ATTEMPTS = 3;
  const CREATE_RETRY_DELAY_MS = 2000;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const createWorkspaceWithRetry = async (txHash) => {
    let lastError;
    for (let attempt = 1; attempt <= CREATE_RETRY_ATTEMPTS; attempt++) {
      try {
        const res = await api.post('/workspace/create', {
          name: newWorkspaceName.trim(),
          description: newWorkspaceDesc.trim(),
          is_public: newWorkspaceVisibility === 'public',
          tx_hash: txHash,
        });
        return res.data;
      } catch (e) {
        lastError = e;
        if (e.response?.status === 402) throw e;
        if (attempt < CREATE_RETRY_ATTEMPTS) {
          setCreateStep(`confirming-retry-${attempt}`);
          await sleep(CREATE_RETRY_DELAY_MS);
        }
      }
    }
    throw lastError;
  };

  const txHashRef = useRef(null);

  const handleCreateWorkspace = async (password) => {
    if (!newWorkspaceName.trim()) return;
    setCreateError('');
    setCreateStep('paying');
    try {
      const txHash = await payTreasury(WORKSPACE_CREATE_COST, password);
      txHashRef.current = txHash;
      setCreateStep('confirming');
      const newWs = await createWorkspaceWithRetry(txHash);
      setWorkspaces([newWs, ...workspaces]);
      setSelectedWorkspace(newWs);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      setNewWorkspaceVisibility('private');
      setShowCreate(false);
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (createStep && createStep.startsWith('confirming')) {
        setCreateError(
          `Payment sent, but hub creation failed after ${CREATE_RETRY_ATTEMPTS} attempts: ${detail || e.message}. ` +
          `Your 5000 CLOSE was sent on-chain and was not lost. Please contact support with this transaction ` +
          `hash so your hub can be created without charging you again: ${txHashRef.current || '(see wallet history)'}`
        );
      } else {
        setCreateError(detail || e.message || 'Payment failed');
      }
    } finally {
      setCreateStep('');
    }
  };

  // Shared by the room-code input and the Discover tab's "Request to
  // Join" buttons.
  const handleJoinWorkspace = async (roomCodeOverride) => {
    const code = (roomCodeOverride || joinCode).trim();
    if (!code) return;
    setJoinStatus('');
    setJoinError('');
    try {
      const res = await api.post('/workspace/join', { room_code: code.toUpperCase() });
      setJoinCode('');
      if (res.data.status === 'pending') {
        setPendingJoin({ workspace_id: res.data.workspace_id, workspace_name: res.data.workspace_name });
        setJoinStatus(res.data.message || 'Pay 6000 CLOSE to activate membership');
      } else {
        setJoinStatus(res.data.message || 'Joined');
        fetchWorkspaces();
      }
    } catch (e) {
      const detail = e.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
        : (typeof detail === 'string' ? detail : 'Failed to join: invalid code');
      setJoinError(message);
    }
  };

  const handlePayJoin = async (password) => {
    if (!pendingJoin) return;
    setJoinPayError('');
    setJoinPayStep('paying');
    try {
      const txHash = await payTreasury(WORKSPACE_JOIN_COST, password);
      setJoinPayStep('confirming');
      await api.post(`/workspace/${pendingJoin.workspace_id}/requests/submit-payment`, { tx_hash: txHash });
      setShowJoinPayment(false);
      setPendingJoin(null);
      setJoinStatus('');
      await fetchWorkspaces();
    } catch (e) {
      setJoinPayError(e.response?.data?.detail || e.message || 'Payment failed');
    } finally {
      setJoinPayStep('');
    }
  };

  const handleApproveWithTxHash = async (txHash) => {
    if (!selectedWorkspace || !approvingUserId) return;
    setRequestActionError('');
    setApproveStep('confirming');
    try {
      await api.post(`/workspace/${selectedWorkspace.id}/requests/${approvingUserId}/approve`, { tx_hash: txHash });
      setApprovingUserId(null);
      await fetchPendingRequests(selectedWorkspace.id);
      await fetchWorkspaces();
    } catch (e) {
      setRequestActionError(e.response?.data?.detail || 'Failed to approve request');
    } finally {
      setApproveStep('');
    }
  };

  const handleRejectRequest = async (requesterId) => {
    if (!selectedWorkspace) return;
    setRequestActionError('');
    try {
      await api.post(`/workspace/${selectedWorkspace.id}/requests/${requesterId}/reject`);
      await fetchPendingRequests(selectedWorkspace.id);
    } catch (e) {
      setRequestActionError(e.response?.data?.detail || 'Failed to reject request');
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!selectedWorkspace) return;
    if (!confirm('Remove this member from the hub?')) return;
    try {
      await api.post(`/workspace/${selectedWorkspace.id}/members/${memberUserId}/remove`);
      await fetchMembers(selectedWorkspace.id);
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!selectedWorkspace) return;
    if (!confirm(`Leave "${selectedWorkspace.name}"?`)) return;
    try {
      await api.post(`/workspace/${selectedWorkspace.id}/leave`);
      setSelectedWorkspace(null);
      setShowMembers(false);
      await fetchWorkspaces();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to leave workspace');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedWorkspace) return;
    try {
      const res = await api.post(`/workspace/${selectedWorkspace.id}/message`, { content: newMessage.trim() });
      setNewMessage('');
      // When the message contains @osai, the response shape is
      // {message, ai_message, ai_error?} instead of the flat message
      // object - ai_message itself doesn't need handling here (the
      // fetchMessages() call below picks it up from the DB like any
      // other message), but a failed AI reply (insufficient balance)
      // is worth surfacing immediately rather than silently dropped.
      if (res.data?.ai_error) {
        alert(res.data.ai_error);
      }
      await fetchMessages(selectedWorkspace.id);
    } catch (e) {
      const status = e.response?.status;
      const detail = e.response?.data?.detail;
      if (status === 403) {
        alert(detail || 'You are not an approved member of this workspace.');
      } else if (detail) {
        alert(`Failed to send message (${status}): ${detail}`);
      } else {
        alert('Failed to send message: no response from server (check connection).');
      }
    }
  };

  const startEditMessage = (msg) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };
  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditContent('');
  };
  const saveEditMessage = async (msgId) => {
    if (!editContent.trim() || !selectedWorkspace) return;
    try {
      await api.put(`/workspace/${selectedWorkspace.id}/message/${msgId}`, { content: editContent.trim() });
      setEditingMessageId(null);
      setEditContent('');
      await fetchMessages(selectedWorkspace.id);
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to edit message');
    }
  };
  const deleteMessage = async (msgId) => {
    if (!selectedWorkspace) return;
    if (!confirm('Delete this message?')) return;
    try {
      await api.delete(`/workspace/${selectedWorkspace.id}/message/${msgId}`);
      await fetchMessages(selectedWorkspace.id);
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete message');
    }
  };

  const copyRoomCode = () => {
    if (selectedWorkspace?.room_code) {
      navigator.clipboard.writeText(selectedWorkspace.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && workspaces.length === 0) {
    return <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Loading workspaces...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] text-[var(--text-primary)] max-w-7xl mx-auto w-full overflow-hidden">
      <div className="border-b border-[var(--border-color)] p-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">Hustle Hub</h1>
          <p className="text-sm text-[var(--text-muted)]">Private, invite-only workspaces — 5000 CLOSE to create, 6000 CLOSE to join</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => { setShowCreate(true); setCreateError(''); }} className="btn-primary flex-1 sm:flex-none justify-center">
            <Plus size={18} /> New
          </button>
          <button onClick={() => document.getElementById('join-input').focus()} className="btn-secondary flex-1 sm:flex-none justify-center">
            <LogIn size={18} /> Join
          </button>
          <button onClick={() => setShowDiscover(true)} className="btn-secondary flex-1 sm:flex-none justify-center">
            <Compass size={18} /> Discover
          </button>
        </div>
      </div>

      <div className="px-5 md:px-7 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/20">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => setSelectedWorkspace(ws)}
            className={`px-4 py-2.5 rounded-2xl text-sm transition-all flex items-center gap-2 shrink-0 whitespace-nowrap border ${
              selectedWorkspace?.id === ws.id
                ? 'bg-[var(--accent-brass)] text-white font-bold'
                : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--border-bright)] text-[var(--text-primary)]'
            }`}
          >
            {ws.is_public ? <Globe size={14} /> : <Lock size={14} />}
            {ws.name}
          </button>
        ))}
        <div className="w-full lg:w-auto lg:min-w-[360px] shrink-0 flex flex-col gap-1 mt-2 lg:mt-0">
          <div className="flex items-center gap-2">
            <input
              id="join-input"
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinStatus(''); setJoinError(''); }}
              className="input-glass flex-1 text-sm rounded-2xl"
            />
            <button onClick={() => handleJoinWorkspace()} className="bg-[var(--accent-brass)] hover:bg-[var(--accent-brass-dim)] text-white px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition shadow-sm">Request to Join</button>
          </div>
          {joinStatus && <p className="text-xs text-[var(--success)]">{joinStatus}</p>}
          {joinError && <p className="text-xs text-[var(--danger)]">{joinError}</p>}
          {pendingJoin && (
            <button
              onClick={() => { setShowJoinPayment(true); setJoinPayError(''); }}
              className="btn-primary text-sm justify-center mt-1"
            >
              Pay 6000 CLOSE to join "{pendingJoin.workspace_name}"
            </button>
          )}
        </div>
      </div>
      </div>

      {selectedWorkspace ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 md:px-7 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div>
              <span className="font-display font-bold text-lg text-[var(--text-primary)]">{selectedWorkspace.name}</span>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Your shared space</p>
            </div>
              {selectedWorkspace.is_public ? (
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><Globe size={12} /> Public</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><Lock size={12} /> Private</span>
              )}
              <button
                onClick={() => setShowMembers(true)}
                className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <Users size={13} /> {selectedWorkspace.member_count || 0} members
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--text-muted)]">Code: {selectedWorkspace.room_code}</span>
              <button onClick={copyRoomCode} className="btn-glass-icon w-8 h-8">
                {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
              {!isOwner && (
                <button onClick={handleLeaveWorkspace} className="btn-glass-icon w-8 h-8 hover:text-[var(--danger)]" title="Leave hub">
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>

          {canManageRequests && (
            <div className="glass-card mx-4 mt-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setPendingRequestsExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-left"
                aria-expanded={pendingRequestsExpanded}
              >
                <div className="flex items-center gap-2">
                  <UserPlus size={16} className="text-[var(--accent-brass)]" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    Pending Join Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                  </span>
                </div>

                <span
                  className={`text-[var(--text-muted)] text-sm transition-transform duration-200 ${
                    pendingRequestsExpanded ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {pendingRequestsExpanded && (
                <div className="mt-3">
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    Requesters now pay and submit their own transaction automatically. This manual approval is a fallback if that doesn't complete — paste their tx hash to verify and approve.
                  </p>

                  {requestActionError && (
                    <p className="text-xs text-[var(--danger)] mb-2">{requestActionError}</p>
                  )}

                  {pendingRequests.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No pending requests.</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingRequests.map((req) => (
                        <div key={req.user_id} className="bg-[var(--bg-tertiary)] rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-primary)]">{req.user_name}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setApprovingUserId(req.user_id); setApproveTxHash(''); }}
                                className="flex items-center gap-1 bg-[var(--success)]/15 text-[var(--success)] hover:bg-[var(--success)]/25 px-3 py-1 rounded-lg text-xs font-bold transition"
                              >
                                <Check size={14} /> Approve
                              </button>

                              <button
                                onClick={() => handleRejectRequest(req.user_id)}
                                className="flex items-center gap-1 bg-[var(--danger)]/15 text-[var(--danger)] hover:bg-[var(--danger)]/25 px-3 py-1 rounded-lg text-xs font-bold transition"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-4 scroll-smooth">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6">
                  <div className="w-16 h-16 rounded-3xl bg-[var(--accent-brass)]/10 flex items-center justify-center mb-4">
                    <Users size={28} className="text-[var(--accent-brass)]" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Start the conversation</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm">This is your space to exchange ideas, collaborate, and build something meaningful.</p>
                </div>
            ) : (
              messages.map((msg) => {
                const isOwnMsg = msg.user_id === user?.id;
                const canDelete = isOwnMsg || canManageRequests;
                const isEditing = editingMessageId === msg.id;
                return (
                  <div key={msg.id} className={`flex ${isOwnMsg ? 'justify-end' : 'justify-start'} group`}>
                    <div className="max-w-[88%] sm:max-w-[75%]">
                      <div className={`glass-card rounded-[1.35rem] px-4 py-3 shadow-sm ${msg.is_ai ? 'border border-[var(--accent-indigo)]/30 bg-[var(--accent-indigo)]/5' : ''}`}>
                        <div className="flex items-center gap-2 text-xs mb-1">
                          {msg.is_ai && <Sparkles size={12} className="text-[var(--accent-indigo)]" />}
                          <span className={`font-bold ${msg.is_ai ? 'text-[var(--accent-indigo)]' : 'text-[var(--accent-brass)]'}`}>{msg.user_name || 'Unknown'}</span>
                          <span className="text-[var(--text-muted)]">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ''}</span>
                          {msg.edited_at && <span className="text-[var(--text-muted)] italic">(edited)</span>}
                        </div>
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="input-base w-full text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditMessage(msg.id);
                                if (e.key === 'Escape') cancelEditMessage();
                              }}
                            />
                            <div className="flex gap-1.5">
                              <button onClick={() => saveEditMessage(msg.id)} className="text-xs text-[var(--success)] font-medium">Save</button>
                              <button onClick={cancelEditMessage} className="text-xs text-[var(--text-muted)]">Cancel</button>
                            </div>
                          </div>
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
                      {!isEditing && (
                        <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMsg ? 'justify-end' : 'justify-start'}`}>
                          {isOwnMsg && (
                            <button onClick={() => startEditMessage(msg)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1" aria-label="Edit">
                              <Pencil size={12} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => deleteMessage(msg.id)} className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1" aria-label="Delete">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4">
            <form onSubmit={handleSendMessage} className="glass-bar rounded-3xl max-w-2xl mx-auto shadow-lg flex items-center gap-2 p-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share an idea, ask a question, or try @osai..."
                className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-brass)] hover:bg-[var(--accent-brass-dim)] text-white shadow-md hover:shadow-lg disabled:shadow-none disabled:hover:bg-[var(--accent-brass)]"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          {workspaces.length === 0 ? 'No workspaces yet. Create, join, or discover one!' : 'Select a workspace to start chatting.'}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel rounded-[1.5rem] w-full max-w-md p-6 md:p-7 space-y-4 shadow-2xl border border-[var(--border-bright)]/50">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">New Hustle Hub</h3>
              <button onClick={() => setShowCreate(false)} className="btn-glass-icon w-9 h-9"><X size={20} /></button>
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] block">Name</label>
              <input type="text" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} className="input-glass w-full mt-1" placeholder="My Workspace" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] block">Description (optional)</label>
              <input type="text" value={newWorkspaceDesc} onChange={(e) => setNewWorkspaceDesc(e.target.value)} className="input-glass w-full mt-1" placeholder="What's this workspace about?" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] block mb-1">Visibility</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewWorkspaceVisibility('private')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition ${
                    newWorkspaceVisibility === 'private'
                      ? 'bg-[var(--accent-brass)]/15 border-[var(--accent-brass)] text-[var(--accent-brass)]'
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Lock size={16} /> Private
                </button>
                <button
                  type="button"
                  onClick={() => setNewWorkspaceVisibility('public')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition ${
                    newWorkspaceVisibility === 'public'
                      ? 'bg-[var(--accent-brass)]/15 border-[var(--accent-brass)] text-[var(--accent-brass)]'
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Globe size={16} /> Public
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Creating a hub costs 5000 CLOSE, sent on-chain to the OS AI treasury.</p>
            {createError && <p className="text-sm text-[var(--danger)]">{createError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreatePassword(true)}
                disabled={!newWorkspaceName.trim() || createStep !== ''}
                className="btn-primary flex-1 justify-center"
              >
                {createStep === 'paying' ? <><Loader2 size={16} className="animate-spin inline mr-1" /> Sending payment...</>
                  : createStep === 'confirming' ? <><Loader2 size={16} className="animate-spin inline mr-1" /> Creating hub...</>
                  : 'Create (5000 CLOSE)'}
              </button>
              <button onClick={() => setShowCreate(false)} disabled={createStep !== ''} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Members panel */}
      {showMembers && selectedWorkspace && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowMembers(false)}>
          <div className="glass-panel rounded-[1.5rem] w-full max-w-md p-6 md:p-7 space-y-3 max-h-[80vh] overflow-y-auto shadow-2xl border border-[var(--border-bright)]/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Members</h3>
              <button onClick={() => setShowMembers(false)} className="btn-glass-icon w-9 h-9"><X size={18} /></button>
            </div>
            {membersLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No members found.</p>
            ) : (
              <div className="space-y-1.5">
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between bg-[var(--bg-tertiary)] rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">{m.user_name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono uppercase">{m.role}</p>
                    </div>
                    {canManageRequests && m.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1.5"
                        aria-label="Remove member"
                      >
                        <UserMinus size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discover panel */}
      {showDiscover && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowDiscover(false)}>
          <div className="glass-panel rounded-[1.5rem] w-full max-w-md p-6 md:p-7 space-y-3 max-h-[80vh] overflow-y-auto shadow-2xl border border-[var(--border-bright)]/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Discover Public Hubs</h3>
              <button onClick={() => setShowDiscover(false)} className="btn-glass-icon w-9 h-9"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-lg px-3 py-2">
              <Search size={14} className="text-[var(--text-muted)]" />
              <input
                type="text"
                value={discoverQuery}
                onChange={(e) => setDiscoverQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchDiscover(); }}
                placeholder="Search hubs..."
                className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] w-full"
              />
            </div>
            {discoverLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading...</p>
            ) : discoverResults.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No public hubs found.</p>
            ) : (
              <div className="space-y-1.5">
                {discoverResults.map((ws) => (
                  <div key={ws.id} className="bg-[var(--bg-tertiary)] rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--text-primary)] font-medium truncate">{ws.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{ws.member_count} members</p>
                      </div>
                      <button
                        onClick={() => { handleJoinWorkspace(ws.room_code); setShowDiscover(false); }}
                        className="btn-secondary text-xs py-1.5 px-3 shrink-0"
                      >
                        Request to Join
                      </button>
                    </div>
                    {ws.description && <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{ws.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={showCreatePassword}
        onClose={() => setShowCreatePassword(false)}
        title="Confirm Payment"
        message="Enter your wallet password to send 5000 CLOSE and create this hub."
        inputType="password"
        inputPlaceholder="Enter password"
        onConfirm={handleCreateWorkspace}
        confirmText="Pay & Create"
        cancelText="Cancel"
      />

      <Modal
        isOpen={showJoinPayment}
        onClose={() => setShowJoinPayment(false)}
        title="Confirm Payment"
        message={`Enter your wallet password to send 6000 CLOSE and join "${pendingJoin?.workspace_name || ''}".`}
        inputType="password"
        inputPlaceholder="Enter password"
        onConfirm={handlePayJoin}
        confirmText={joinPayStep ? 'Processing...' : 'Pay & Join'}
        cancelText="Cancel"
      />
      {joinPayError && showJoinPayment && (
        <p className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] text-sm text-[var(--danger)] bg-[var(--bg-secondary)] border border-[var(--danger)]/30 rounded-lg px-4 py-2">
          {joinPayError}
        </p>
      )}

      <Modal
        isOpen={!!approvingUserId}
        onClose={() => setApprovingUserId(null)}
        title="Approve Join Request"
        message="Paste the 6000 CLOSE payment transaction hash the requester sent (fallback — normally not needed)."
        inputType="text"
        inputPlaceholder="0x..."
        onConfirm={handleApproveWithTxHash}
        confirmText={approveStep ? 'Verifying...' : 'Verify & Approve'}
        cancelText="Cancel"
      />
    </div>
  );
}
