import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Plus, Users, LogIn, Send, Sparkles, Coins } from 'lucide-react';
import { signBurn, broadcastTx } from '../utils/ethers';

const HUB_FEE = 1000;

export default function HustleHub() {
    const { user } = useAuth();
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [selectedHub, setSelectedHub] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [ws, setWs] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);
    const scrollRef = useRef(null);

    // Create hub states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    // Join hub states
    const [roomCode, setRoomCode] = useState('');
    const [joinPassword, setJoinPassword] = useState('');

    // Burn confirmation state
    const [pendingAction, setPendingAction] = useState(null);

    const fetchHubs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get('/workspace/list');
            setHubs(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHubs();
    }, [user]);

    const loadMessages = async (hubId) => {
        try {
            const res = await api.get(`/workspace/${hubId}/messages`);
            setMessages(res.data);
            scrollToBottom();
        } catch (e) {
            console.error(e);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const connectWebSocket = (hubId) => {
        if (ws) ws.close();
        const token = localStorage.getItem('token');
        const wsUrl = `ws://localhost:8000/ws/workspace/${hubId}`;
        const socket = new WebSocket(wsUrl);
        socket.onopen = () => {
            setWsConnected(true);
            socket.send(token);
        };
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMessages(prev => [...prev, data]);
                scrollToBottom();
            } catch {
                setMessages(prev => [...prev, { content: event.data, is_ai: false, user_name: 'System' }]);
                scrollToBottom();
            }
        };
        socket.onclose = () => {
            setWsConnected(false);
        };
        setWs(socket);
    };

    const selectHub = (hub) => {
        setSelectedHub(hub);
        loadMessages(hub.id);
        connectWebSocket(hub.id);
    };

    const handleCreateHub = async () => {
        if (!name.trim()) return;
        try {
            const res = await api.post('/workspace/create', {
                name: name.trim(),
                description,
                password,
                is_public: isPublic,
            });
            // Check if burn payload is returned
            if (res.data.burn_payload) {
                // Prompt user to sign burn
                const confirm = window.confirm(`Creating this Hustle Hub costs ${HUB_FEE} CLOSE. Click OK to sign the burn transaction.`);
                if (!confirm) {
                    // Abort
                    return;
                }
                // Sign and broadcast
                const password = prompt('Enter your wallet password:');
                if (!password) return;
                const seedRes = await api.get('/wallet/seed');
                const encryptedSeed = seedRes.data.encrypted_seed;
                const signedTx = await signBurn(
                    encryptedSeed,
                    password,
                    res.data.burn_payload.contract,
                    res.data.burn_payload.amount,
                    res.data.burn_payload.chain
                );
                // Broadcast with reference
                const broadcastRes = await api.post('/wallet/burn', {
                    signed_tx: signedTx,
                    reference_id: res.data.burn_payload.reference_id,
                    action_type: res.data.burn_payload.action,
                });
                alert(`Hub created! Room code: ${res.data.room_code}`);
                setShowCreate(false);
                setName('');
                setDescription('');
                setPassword('');
                setIsPublic(true);
                fetchHubs();
            } else {
                alert(`Hub created! Room code: ${res.data.room_code}`);
                setShowCreate(false);
                setName('');
                setDescription('');
                setPassword('');
                fetchHubs();
            }
        } catch (e) {
            alert(e.response?.data?.detail || 'Failed to create Hub');
        }
    };

    const handleJoinHub = async () => {
        if (!roomCode.trim()) return;
        try {
            const res = await api.post('/workspace/join', {
                room_code: roomCode.trim(),
                password: joinPassword,
            });
            if (res.data.burn_payload) {
                const confirm = window.confirm(`Joining this Hustle Hub costs ${HUB_FEE} CLOSE. Click OK to sign the burn transaction.`);
                if (!confirm) return;
                const password = prompt('Enter your wallet password:');
                if (!password) return;
                const seedRes = await api.get('/wallet/seed');
                const encryptedSeed = seedRes.data.encrypted_seed;
                const signedTx = await signBurn(
                    encryptedSeed,
                    password,
                    res.data.burn_payload.contract,
                    res.data.burn_payload.amount,
                    res.data.burn_payload.chain
                );
                const broadcastRes = await api.post('/wallet/burn', {
                    signed_tx: signedTx,
                    reference_id: res.data.burn_payload.reference_id,
                    action_type: res.data.burn_payload.action,
                });
                alert('Joined Hub successfully!');
                setShowJoin(false);
                setRoomCode('');
                setJoinPassword('');
                fetchHubs();
            } else {
                alert('Joined Hub successfully!');
                setShowJoin(false);
                setRoomCode('');
                setJoinPassword('');
                fetchHubs();
            }
        } catch (e) {
            alert(e.response?.data?.detail || 'Failed to join Hub');
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !selectedHub) return;
        try {
            await api.post(`/workspace/${selectedHub.id}/message`, {
                content: input.trim(),
            });
            setInput('');
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-4 text-muted">Loading Hustle Hubs...</div>;

    return (
        <div className="flex h-full">
            {/* Hub List */}
            <div className="w-64 border-r border-line p-4 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-[13px] text-muted font-mono uppercase tracking-wide">Hustle Hubs</h2>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setShowCreate(true)}
                            className="text-muted hover:text-bone"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={() => setShowJoin(true)}
                            className="text-muted hover:text-bone"
                        >
                            <LogIn size={16} />
                        </button>
                    </div>
                </div>

                {hubs.length === 0 ? (
                    <p className="text-[13px] text-muted">No Hustle Hubs yet.</p>
                ) : (
                    hubs.map((hub) => (
                        <div
                            key={hub.id}
                            onClick={() => selectHub(hub)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedHub?.id === hub.id
                                    ? 'bg-brass/10 border border-brass/30'
                                    : 'hover:bg-white/5'
                            }`}
                        >
                            <p className="text-[14px] text-bone font-medium">{hub.name}</p>
                            <p className="text-[11px] text-muted font-mono">{hub.room_code}</p>
                            <p className="text-[11px] text-muted">{hub.member_count} members</p>
                            {hub.status === 'pending' && (
                                <p className="text-[10px] text-brass font-mono">⌛ awaiting payment</p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Chat Area */}
            {selectedHub ? (
                <div className="flex-1 flex flex-col">
                    <div className="border-b border-line px-4 py-3 flex justify-between items-center">
                        <div>
                            <h2 className="text-[16px] text-bone">{selectedHub.name}</h2>
                            <p className="text-[11px] text-muted">{selectedHub.room_code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Coins size={14} className="text-brass" />
                            <span className="text-[11px] text-muted">Powered by CLOSE</span>
                        </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.is_ai ? 'justify-start' : 'justify-end'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-3.5 py-2 text-[13px] ${
                                        msg.is_ai
                                            ? 'ledger-card text-bone'
                                            : 'bg-brass/20 text-bone'
                                    }`}
                                >
                                    {!msg.is_ai && (
                                        <span className="text-[10px] text-muted">{msg.user_name}</span>
                                    )}
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-line px-4 py-3 flex items-center gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder={wsConnected ? 'Type a message...' : 'Reconnecting...'}
                            className="flex-1 bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone placeholder-muted focus:outline-none focus:border-brass"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!wsConnected}
                            className="bg-brass hover:bg-brassLight disabled:opacity-50 text-void rounded-md p-2.5 press-soft touch-target"
                        >
                            <Send size={16} />
                        </button>
                        <button
                            onClick={() => {
                                setInput('/ai ');
                                document.querySelector('input')?.focus();
                            }}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-md p-2.5 press-soft touch-target"
                            title="Ask AI in this Hub"
                        >
                            <Sparkles size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted">
                    <p>Select a Hustle Hub to start collaborating</p>
                </div>
            )}

            {/* Create Hub Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-panel2 border border-line rounded-lg w-full max-w-md p-6 space-y-4">
                        <h3 className="text-[16px] font-display text-bone">Create Hustle Hub</h3>
                        <p className="text-[12px] text-muted">Costs <span className="text-brass font-mono">{HUB_FEE} CLOSE</span> to create</p>
                        <div>
                            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
                                placeholder="My Hustle Hub"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
                                placeholder="Team collaboration space"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Password (optional)</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
                                placeholder="Leave blank for public"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                className="w-4 h-4 accent-brass"
                            />
                            <label className="text-[12px] text-muted">Public (anyone can join)</label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateHub}
                                className="flex-1 bg-brass hover:bg-brassLight text-void font-semibold rounded-md py-2.5 press-soft touch-target"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 bg-panel border border-line text-muted hover:text-bone rounded-md py-2.5 press-soft touch-target"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Hub Modal */}
            {showJoin && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-panel2 border border-line rounded-lg w-full max-w-md p-6 space-y-4">
                        <h3 className="text-[16px] font-display text-bone">Join Hustle Hub</h3>
                        <p className="text-[12px] text-muted">Costs <span className="text-brass font-mono">{HUB_FEE} CLOSE</span> to join</p>
                        <div>
                            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Room Code</label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
                                placeholder="ABC123"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Password (if required)</label>
                            <input
                                type="password"
                                value={joinPassword}
                                onChange={(e) => setJoinPassword(e.target.value)}
                                className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
                                placeholder="Enter password"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleJoinHub}
                                className="flex-1 bg-brass hover:bg-brassLight text-void font-semibold rounded-md py-2.5 press-soft touch-target"
                            >
                                Join
                            </button>
                            <button
                                onClick={() => setShowJoin(false)}
                                className="flex-1 bg-panel border border-line text-muted hover:text-bone rounded-md py-2.5 press-soft touch-target"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}