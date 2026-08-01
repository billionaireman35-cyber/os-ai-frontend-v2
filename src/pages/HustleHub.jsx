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

  if (loading) return <div className="p-4 text-[var(--text-muted)]">Loading Hustle Hubs...</div>;

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Hustle Hub</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Create</button>
          <button onClick={() => setShowJoin(true)} className="btn-secondary flex items-center gap-2"><LogIn size={18} /> Join</button>
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)]">Collaborate with others worldwide. Each Hub costs 1,000 CLOSE.</p>
      {hubs.length === 0 ? (
        <p className="text-[var(--text-muted)]">No Hustle Hubs yet.</p>
      ) : (
        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
          {hubs.map((hub) => (
            <div key={hub.id} className="glass-card p-4">
              <div className="flex justify-between">
                <h3 className="text-lg text-[var(--text-primary)] font-bold">{hub.name}</h3>
                <span className="text-sm text-[var(--text-muted)] font-mono">{hub.room_code}</span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{hub.description || 'No description'}</p>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-1">{hub.member_count} members · {hub.role}</p>
            </div>
          ))}
        </div>
      )}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Create Hustle Hub</h3>
            <p className="text-sm text-[var(--text-muted)]">Costs <span className="text-[var(--accent-brass)] font-mono">1,000 CLOSE</span> to create</p>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-base" placeholder="Name" />
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-base" placeholder="Description" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" placeholder="Password (optional)" />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4 accent-[var(--accent-indigo)]" />
              <label className="text-sm text-[var(--text-muted)]">Public</label>
            </div>
            <div className="flex gap-2">
              <button onClick={createHub} className="btn-primary flex-1 justify-center">Create</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Join Hustle Hub</h3>
            <p className="text-sm text-[var(--text-muted)]">Costs <span className="text-[var(--accent-brass)] font-mono">1,000 CLOSE</span> to join</p>
            <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} className="input-base" placeholder="Room Code" />
            <input type="password" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} className="input-base" placeholder="Password (if required)" />
            <div className="flex gap-2">
              <button onClick={joinHub} className="btn-primary flex-1 justify-center">Join</button>
              <button onClick={() => setShowJoin(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
