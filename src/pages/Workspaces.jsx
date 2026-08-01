import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, FolderOpen, Trash2, CheckCircle, Briefcase } from 'lucide-react';

export default function Workspaces() {
  const { workspaces, addWorkspace, removeWorkspace, setActiveWorkspace } = useApp();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addWorkspace(name, desc);
    setName('');
    setDesc('');
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Briefcase className="text-[#d4af37]" size={24} /> Workspaces
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Isolate your AI contexts and project environments</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#d4af37] text-black font-bold rounded-xl text-xs md:text-sm hover:bg-[#b5942f] transition-all"
        >
          <Plus size={16} /> New Workspace
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="p-5 bg-[#111111] border border-[#d4af37]/30 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-[#d4af37]">Create Workspace</h3>
          <input
            type="text"
            placeholder="Workspace Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[#d4af37] text-black text-xs font-bold rounded-xl hover:bg-[#b5942f]">Save</button>
            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-white/5 text-gray-300 text-xs rounded-xl hover:bg-white/10">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            onClick={() => setActiveWorkspace(ws.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              ws.active
                ? 'bg-[#d4af37]/10 border-[#d4af37]'
                : 'bg-[#111111] border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className={ws.active ? 'text-[#d4af37]' : 'text-gray-400'} size={20} />
                  <h3 className="font-bold text-white text-base truncate">{ws.name}</h3>
                </div>
                {ws.active && <CheckCircle size={16} className="text-[#d4af37]" />}
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">{ws.desc}</p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <span className="text-[11px] font-mono text-gray-500">{ws.active ? 'Active' : 'Standby'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeWorkspace(ws.id); }}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
