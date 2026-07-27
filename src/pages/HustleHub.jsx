import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Plus, LogIn } from 'lucide-react';

export default function HustleHub() {
  const { user } = useAuth();
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const fetchHubs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/workspace/list');
      setHubs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, [user]);

  const createHub = async () => {
    if (!name.trim()) return;
    try {
      const res = await api.post('/workspace/create', {
        name: name.trim(),
        description,
        password,
        is_public: isPublic,
      });
      alert(`Hub created! Room code: ${res.data.room_code}`);
      setShowCreate(false);
      setName('');
      setDescription('');
      setPassword('');
      fetchHubs();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create Hub');
    }
  };

  const joinHub = async () => {
    if (!roomCode.trim()) return;
    try {
      await api.post('/workspace/join', {
        room_code: roomCode.trim(),
        password: joinPassword,
      });
      alert('Joined Hub successfully!');
      setShowJoin(false);
      setRoomCode('');
      setJoinPassword('');
      fetchHubs();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to join Hub');
    }
  };

  if (loading) return <div className="p-4 text-[var(--color-text-muted)]">Loading Hustle Hubs...</div>;

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-[var(--color-text-primary)]">Hustle Hub</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)} className="bg-brass hover:bg-brassLight text-void text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target flex items-center gap-1">
            <Plus size={16} /> Create
          </button>
          <button onClick={() => setShowJoin(true)} className="bg-teal/20 hover:bg-teal/30 text-teal text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target flex items-center gap-1">
            <LogIn size={16} /> Join
          </button>
        </div>
      </div>
      <p className="text-[13px] text-[var(--color-text-muted)]">Collaborate with others worldwide. Each Hub costs 1,000 CLOSE to create or join.</p>
      {hubs.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-[13px]">No Hustle Hubs yet.</p>
      ) : (
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
          {hubs.map((hub) => (
            <div key={hub.id} className="ledger-card p-4">
              <div className="flex justify-between">
                <h3 className="text-[16px] text-[var(--color-text-primary)] font-medium">{hub.name}</h3>
                <span className="text-[11px] text-[var(--color-text-muted)] font-mono">{hub.room_code}</span>
              </div>
              <p className="text-[13px] text-[var(--color-text-muted)]">{hub.description || 'No description'}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-1">{hub.member_count} members · {hub.role}</p>
            </div>
          ))}
        </div>
      )}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-panel2)] border border-[var(--color-line)] rounded-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-display text-[var(--color-text-primary)]">Create Hustle Hub</h3>
            <p className="text-[12px] text-[var(--color-text-muted)]">Costs <span className="text-brass font-mono">1,000 CLOSE</span> to create</p>
            <div><label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass" placeholder="My Hustle Hub" /></div>
            <div><label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass" placeholder="Team collaboration space" /></div>
            <div><label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Password (optional)</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass" placeholder="Leave blank for public" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4 accent-brass" /><label className="text-[12px] text-[var(--color-text-muted)]">Public (anyone can join)</label></div>
            <div className="flex gap-2"><button onClick={createHub} className="flex-1 bg-brass hover:bg-brassLight text-void font-semibold rounded-md py-2.5 press-soft touch-target">Create</button><button onClick={() => setShowCreate(false)} className="flex-1 bg-[var(--color-panel)] border border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-md py-2.5 press-soft touch-target">Cancel</button></div>
          </div>
        </div>
      )}
      {showJoin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-panel2)] border border-[var(--color-line)] rounded-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-display text-[var(--color-text-primary)]">Join Hustle Hub</h3>
            <p className="text-[12px] text-[var(--color-text-muted)]">Costs <span className="text-brass font-mono">1,000 CLOSE</span> to join</p>
            <div><label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Room Code</label><input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass" placeholder="ABC123" /></div>
            <div><label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Password (if required)</label><input type="password" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass" placeholder="Enter password" /></div>
            <div className="flex gap-2"><button onClick={joinHub} className="flex-1 bg-brass hover:bg-brassLight text-void font-semibold rounded-md py-2.5 press-soft touch-target">Join</button><button onClick={() => setShowJoin(false)} className="flex-1 bg-[var(--color-panel)] border border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-md py-2.5 press-soft touch-target">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
