import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Modal } from '../components/ui/Modal';
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      setJoinError(e.response?.data?.detail || 'Failed to join: invalid code');
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
    <div className="flex flex-col h-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="border-b border-[var(--border-color)] p-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">Hustle Hub</h1>
          <p className="text-sm text-[var(--text-muted)]">Private, invite-only workspaces — 5000 CLOSE to create, 6000 CLOSE to join</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreate(true); setCreateError(''); }} className="btn-primary">
            <Plus size={18} /> New
          </button>
          <button onClick={() => document.getElementById('join-input').focus()} className="btn-secondary">
            <LogIn size={18} /> Join
          </button>
          <button onClick={() => setShowDiscover(true)} className="btn-secondary">
            <Compass size={18} /> Discover
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-[var(--border-color)]">
        {workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => setSelectedWorkspace(ws)}
            className={`px-4 py-2 rounded-full text-sm transition flex items-center gap-1 ${
              selectedWorkspace?.id === ws.id
                ? 'bg-[var(--accent-brass)] text-white font-bold'
                : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--border-bright)] text-[var(--text-primary)]'
            }`}
          >
            {ws.is_public ? <Globe size={14} /> : <Lock size={14} />}
            {ws.name}
          </button>
        ))}
        <div className="flex-1 min-w-[150px] flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              id="join-input"
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinStatus(''); setJoinError(''); }}
              className="input-glass flex-1 text-sm"
            />
            <button onClick={() => handleJoinWorkspace()} className="bg-[var(--accent-brass)] text-white px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap">Request to Join</button>
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

      {selectedWorkspace ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)]">{selectedWorkspace.name}</span>
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
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={16} className="text-[var(--accent-brass)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  Pending Join Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-2">
                Requesters now pay and submit their own transaction automatically. This manual approval is a fallback if that doesn't complete — paste their tx hash to verify and approve.
              </p>
              {requestActionError && <p className="text-xs text-[var(--danger)] mb-2">{requestActionError}</p>}
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

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] py-10">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => {
                const isOwnMsg = msg.user_id === user?.id;
                const canDelete = isOwnMsg || canManageRequests;
                const isEditing = editingMessageId === msg.id;
                return (
                  <div key={msg.id} className={`flex ${isOwnMsg ? 'justify-end' : 'justify-start'} group`}>
                    <div className="max-w-[75%]">
                      <div className={`glass-card rounded-2xl px-4 py-2 ${msg.is_ai ? 'border border-[var(--accent-indigo)]/30' : ''}`}>
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
                          <p className="whitespace-pre-wrap break-words text-[var(--text-primary)]">{msg.content}</p>
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
                placeholder="Type a message... (try @osai to ask OS AI)"
                className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-brass)] hover:bg-[var(--accent-brass-dim)] text-white shadow-md hover:shadow-lg disabled:shadow-none disabled:hover:bg-[var(--accent-brass)]"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowMembers(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-3 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowDiscover(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-3 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
