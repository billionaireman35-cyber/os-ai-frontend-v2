import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Modal } from '../components/ui/Modal';
import { Plus, Users, MessageSquare, X, Send, Copy, CheckCircle, LogIn, UserPlus, Lock, Globe, Check, XCircle, Loader2 } from 'lucide-react';

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
  const [createStep, setCreateStep] = useState(''); // '', 'paying', 'confirming'
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinStatus, setJoinStatus] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [canManageRequests, setCanManageRequests] = useState(false);
  const [requestActionError, setRequestActionError] = useState('');
  const [approvingUserId, setApprovingUserId] = useState(null); // which request's password modal is open
  const [approveStep, setApproveStep] = useState(''); // '', 'paying', 'confirming' - shown while approving

  const messagesEndRef = useRef(null);

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

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchMessages(selectedWorkspace.id);
      fetchPendingRequests(selectedWorkspace.id);
      setRequestActionError('');
      const msgInterval = setInterval(() => fetchMessages(selectedWorkspace.id), 5000);
      const reqInterval = setInterval(() => fetchPendingRequests(selectedWorkspace.id), 10000);
      return () => {
        clearInterval(msgInterval);
        clearInterval(reqInterval);
      };
    } else {
      setPendingRequests([]);
      setCanManageRequests(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Shared helper: send CLOSE to the treasury, return the tx_hash. Throws
  // with a human-readable message on any failure (password, insufficient
  // balance, on-chain failure, etc.) - caller decides how to surface it.
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

  const handleCreateWorkspace = async (password) => {
    if (!newWorkspaceName.trim()) return;
    setCreateError('');
    setCreateStep('paying');
    try {
      const txHash = await payTreasury(WORKSPACE_CREATE_COST, password);
      setCreateStep('confirming');
      const res = await api.post('/workspace/create', {
        name: newWorkspaceName.trim(),
        description: newWorkspaceDesc.trim(),
        is_public: newWorkspaceVisibility === 'public',
        tx_hash: txHash,
      });
      const newWs = res.data;
      setWorkspaces([newWs, ...workspaces]);
      setSelectedWorkspace(newWs);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      setNewWorkspaceVisibility('private');
      setShowCreate(false);
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (createStep === 'confirming') {
        // Payment succeeded on-chain but workspace creation failed after -
        // this is a real edge case worth a clearer message, since the
        // user's CLOSE has already moved.
        setCreateError(
          `Payment sent, but hub creation failed: ${detail || e.message}. ` +
          `Your CLOSE was sent on-chain - contact support with this if it doesn't resolve.`
        );
      } else {
        setCreateError(detail || e.message || 'Payment failed');
      }
    } finally {
      setCreateStep('');
    }
  };

  const handleJoinWorkspace = async () => {
    if (!joinCode.trim()) return;
    setJoinStatus('');
    setJoinError('');
    try {
      const res = await api.post('/workspace/join', { room_code: joinCode.trim().toUpperCase() });
      setJoinCode('');
      setJoinStatus(res.data.message || 'Request sent');
    } catch (e) {
      setJoinError(e.response?.data?.detail || 'Failed to join: invalid code');
    }
  };

  // Approval flow (current version, manual step): the REQUESTER pays 6000
  // CLOSE to the treasury themselves via their own Vault, then shares the
  // resulting tx hash with the hub admin outside the app (message, etc).
  // The admin pastes that hash here to verify and finalize. No password is
  // collected in this modal - the admin isn't paying, just confirming a
  // payment the requester already made.
  const [approveTxHash, setApproveTxHash] = useState('');

  const handleApproveWithTxHash = async (txHash) => {
    if (!selectedWorkspace || !approvingUserId) return;
    setRequestActionError('');
    setApproveStep('confirming');
    try {
      await api.post(`/workspace/${selectedWorkspace.id}/requests/${approvingUserId}/approve`, {
        tx_hash: txHash,
      });
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedWorkspace) return;
    try {
      await api.post(`/workspace/${selectedWorkspace.id}/message`, { content: newMessage.trim() });
      setNewMessage('');
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
      <div className="border-b border-[var(--border-color)] p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">Hustle Hub</h1>
          <p className="text-sm text-[var(--text-muted)]">Private, invite-only workspaces - 5000 CLOSE to create, 6000 CLOSE to join</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreate(true); setCreateError(''); }} className="bg-[#d4af37] hover:bg-[#c4a030] text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition">
            <Plus size={18} /> New
          </button>
          <button onClick={() => document.getElementById('join-input').focus()} className="bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] px-4 py-2 rounded-xl flex items-center gap-2 transition">
            <LogIn size={18} /> Join
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
        {workspaces.map((ws) => (
          <button key={ws.id} onClick={() => setSelectedWorkspace(ws)} className={`px-4 py-2 rounded-full text-sm transition flex items-center gap-1 ${selectedWorkspace?.id === ws.id ? 'bg-[#d4af37] text-black font-bold' : 'bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)]'}`}>
            {ws.is_public ? <Globe size={14} /> : <Lock size={14} />}
            {ws.name}
          </button>
        ))}
        <div className="flex-1 min-w-[150px] flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input id="join-input" type="text" placeholder="Enter room code" value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinStatus(''); setJoinError(''); }}
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#d4af37]" />
            <button onClick={handleJoinWorkspace} className="bg-[#d4af37] text-black px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap">Request to Join</button>
          </div>
          {joinStatus && <p className="text-xs text-green-400">{joinStatus}</p>}
          {joinError && <p className="text-xs text-red-400">{joinError}</p>}
        </div>
      </div>

      {selectedWorkspace ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)]">{selectedWorkspace.name}</span>
              {selectedWorkspace.is_public ? (
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><Globe size={12} /> Public</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><Lock size={12} /> Private</span>
              )}
              <span className="text-sm text-[var(--text-muted)]">• {selectedWorkspace.member_count || 0} members</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--text-muted)]">Code: {selectedWorkspace.room_code}</span>
              <button onClick={copyRoomCode} className="text-[var(--text-muted)] hover:text-[#d4af37]">
                {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {canManageRequests && (
            <div className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={16} className="text-[#d4af37]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  Pending Join Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-2">
                To approve, the requester must first send 6000 CLOSE to the OS AI treasury from their own Vault, then message you the transaction hash from that payment. Paste it below to verify and approve.
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-2 font-mono break-all">
                Treasury address: {TREASURY_ADDRESS}
              </p>
              {requestActionError && <p className="text-xs text-red-400 mb-2">{requestActionError}</p>}
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No pending requests.</p>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div key={req.user_id} className="bg-[var(--bg-secondary)] rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-primary)]">{req.user_name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setApprovingUserId(req.user_id); setApproveTxHash(''); }}
                            className="flex items-center gap-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1 rounded-lg text-xs font-bold transition"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.user_id)}
                            className="flex items-center gap-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded-lg text-xs font-bold transition"
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

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-primary)]">
            {messages.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] py-10">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.user_id === user?.id ? 'bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-black' : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]'}`}>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                      <span className="font-bold text-[#d4af37]">{msg.user_name || 'Unknown'}</span>
                      <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ''}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-[var(--border-color)] p-4 bg-[var(--bg-secondary)] flex gap-3">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition" />
            <button type="submit" disabled={!newMessage.trim()} className="bg-[#d4af37] hover:bg-[#c4a030] disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-2xl transition">
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          {workspaces.length === 0 ? 'No workspaces yet. Create or request to join one!' : 'Select a workspace to start chatting.'}
        </div>
      )}

      {/* Create modal - form first, then password confirm triggers payment + creation */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">New Hustle Hub</h3>
              <button onClick={() => setShowCreate(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={24} /></button>
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] block">Name</label>
              <input type="text" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} className="input-base w-full mt-1" placeholder="My Workspace" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] block">Description (optional)</label>
              <input type="text" value={newWorkspaceDesc} onChange={(e) => setNewWorkspaceDesc(e.target.value)} className="input-base w-full mt-1" placeholder="What's this workspace about?" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] block mb-1">Visibility</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewWorkspaceVisibility('private')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition ${newWorkspaceVisibility === 'private' ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                  <Lock size={16} /> Private
                </button>
                <button type="button" onClick={() => setNewWorkspaceVisibility('public')} className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition ${newWorkspaceVisibility === 'public' ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                  <Globe size={16} /> Public
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Creating a hub costs 5000 CLOSE, sent on-chain to the OS AI treasury.</p>
            {createError && <p className="text-sm text-red-400">{createError}</p>}
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

      <Modal
        isOpen={showCreatePassword}
        onClose={() => setShowCreatePassword(false)}
        title="Confirm Payment"
        message={`Enter your wallet password to send 5000 CLOSE and create this hub.`}
        inputType="password"
        inputPlaceholder="Enter password"
        onConfirm={handleCreateWorkspace}
        confirmText="Pay & Create"
        cancelText="Cancel"
      />

      {/* Approve: admin pastes the requester's tx_hash - no password, admin isn't paying */}
      <Modal
        isOpen={!!approvingUserId}
        onClose={() => setApprovingUserId(null)}
        title="Approve Join Request"
        message="Paste the 6000 CLOSE payment transaction hash the requester sent you."
        inputType="text"
        inputPlaceholder="0x..."
        onConfirm={handleApproveWithTxHash}
        confirmText={approveStep ? 'Verifying...' : 'Verify & Approve'}
        cancelText="Cancel"
      />
    </div>
  );
}
