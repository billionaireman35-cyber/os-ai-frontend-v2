import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Plus, Trash2, Copy, Check, Lock, X } from 'lucide-react';

const GOLD_THRESHOLD = 10000;

export default function Developer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState('chat,research,portfolio');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState('new_message');
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const hasAccess = user?.stake_tier === 'gold' || user?.stake_tier === 'platinum' || user?.is_founder;
  const closeStaked = user?.close_staked || 0;
  const progressPct = Math.min(100, (closeStaked / GOLD_THRESHOLD) * 100);

  const fetchData = async () => {
    if (!user || !hasAccess) { setLoading(false); return; }
    setLoading(true);
    try {
      const [keysRes, hooksRes] = await Promise.all([
        api.get('/developer/api-keys'),
        api.get('/developer/webhooks'),
      ]);
      setApiKeys(keysRes.data);
      setWebhooks(hooksRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const createApiKey = async () => {
    if (!newKeyLabel.trim()) return;
    try {
      const res = await api.post('/developer/api-key', {
        label: newKeyLabel.trim(),
        scopes: newKeyScopes,
      });
      setNewKey(res.data.api_key);
      fetchData();
      setShowKeyForm(false);
      setNewKeyLabel('');
      setNewKeyScopes('chat,research,portfolio');
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create API key');
    }
  };

  const deleteApiKey = async (id) => {
    if (!confirm('Delete this API key?')) return;
    try {
      await api.delete(`/developer/api-key/${id}`);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete');
    }
  };

  const createWebhook = async () => {
    if (!newWebhookUrl.trim()) return;
    try {
      await api.post('/developer/webhook', {
        url: newWebhookUrl.trim(),
        events: newWebhookEvents,
      });
      fetchData();
      setShowWebhookForm(false);
      setNewWebhookUrl('');
      setNewWebhookEvents('new_message');
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create webhook');
    }
  };

  const deleteWebhook = async (id) => {
    if (!confirm('Delete this webhook?')) return;
    try {
      await api.delete(`/developer/webhook/${id}`);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasAccess) {
    return (
      <div className="p-4 tablet:p-6 max-w-md mx-auto">
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Foundry</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 mb-6">API keys and webhooks to integrate with OS AI</p>

        <div className="glass-card p-7 text-center">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent-brass)]/12 text-[var(--accent-brass-bright)] flex items-center justify-center mx-auto mb-3.5">
            <Lock size={20} />
          </div>
          <p className="text-[17px] font-bold text-[var(--text-primary)] mb-1.5">Foundry is a Gold+ feature</p>
          <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed mb-4">
            API keys and webhooks are available to Gold and Platinum members staking at least {GOLD_THRESHOLD.toLocaleString()} CLOSE.
          </p>

          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-tertiary)] rounded-lg mb-2 text-[13px]">
            <span className="text-[var(--text-secondary)]">Tier</span>
            <span className="flex items-center gap-1.5 font-semibold text-[var(--text-muted)]">
              <X size={13} strokeWidth={2.5} />
              {user?.stake_tier === 'bronze' || !user?.stake_tier ? 'Bronze' : user.stake_tier}
              <span className="font-normal">&nbsp;(need Gold+)</span>
            </span>
          </div>

          <div className="flex justify-between text-[11.5px] text-[var(--text-muted)] mb-1">
            <span>{closeStaked.toLocaleString()} CLOSE staked</span>
            <span>{GOLD_THRESHOLD.toLocaleString()} required</span>
          </div>
          <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-[var(--accent-brass)]" style={{ width: `${progressPct}%` }} />
          </div>

          <button
            onClick={() => navigate('/vault?tab=staking')}
            className="btn-primary w-full justify-center text-[14.5px]"
          >
            Stake CLOSE to Unlock
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-4 text-[var(--text-muted)]">Loading...</div>;

  return (
    <div className="p-4 tablet:p-6 space-y-6 max-w-4xl">
      <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Foundry</h1>
      <p className="text-sm text-[var(--text-muted)]">API keys and webhooks to integrate with OS AI</p>

      {/* API Keys */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">API Keys</h2>
          <button
            onClick={() => setShowKeyForm(true)}
            className="text-[var(--accent-brass-bright)] hover:text-[var(--accent-brass)] text-sm font-medium flex items-center gap-1"
          >
            <Plus size={16} /> Create Key
          </button>
        </div>

        {showKeyForm && (
          <div className="glass-card p-4 space-y-3 mb-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Label</label>
              <input
                type="text"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                className="input-base"
                placeholder="Production key"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Scopes</label>
              <input
                type="text"
                value={newKeyScopes}
                onChange={(e) => setNewKeyScopes(e.target.value)}
                className="input-base"
                placeholder="chat,research,portfolio"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={createApiKey} className="btn-primary">Create</button>
              <button onClick={() => { setShowKeyForm(false); setNewKeyLabel(''); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {newKey && (
          <div className="glass-card p-4 mb-3" style={{ borderColor: 'rgba(192,90,60,0.3)' }}>
            <p className="text-xs text-[var(--text-muted)] font-mono uppercase">Your new API key</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-[var(--bg-tertiary)] px-3 py-2 rounded-md text-sm text-[var(--text-primary)] font-mono break-all">
                {newKey}
              </code>
              <button onClick={() => copyToClipboard(newKey)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                {copied ? <Check size={16} className="text-[var(--success)]" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs text-[var(--danger)] mt-1">Store this securely – it won't be shown again</p>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div key={key.id} className="glass-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-primary)]">{key.label}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">{key.scopes} · {key.is_active ? 'active' : 'inactive'}</p>
                </div>
                <button onClick={() => deleteApiKey(key.id)} className="text-[var(--danger)] hover:text-[var(--danger)]/70">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhooks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Webhooks</h2>
          <button
            onClick={() => setShowWebhookForm(true)}
            className="text-[var(--accent-brass-bright)] hover:text-[var(--accent-brass)] text-sm font-medium flex items-center gap-1"
          >
            <Plus size={16} /> Add Webhook
          </button>
        </div>

        {showWebhookForm && (
          <div className="glass-card p-4 space-y-3 mb-3">
            <div>
              <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">URL</label>
              <input
                type="url"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="input-base"
                placeholder="https://example.com/webhook"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Events</label>
              <input
                type="text"
                value={newWebhookEvents}
                onChange={(e) => setNewWebhookEvents(e.target.value)}
                className="input-base"
                placeholder="new_message"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={createWebhook} className="btn-primary">Create</button>
              <button onClick={() => { setShowWebhookForm(false); setNewWebhookUrl(''); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {webhooks.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No webhooks yet.</p>
        ) : (
          <div className="space-y-2">
            {webhooks.map((hook) => (
              <div key={hook.id} className="glass-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-primary)] break-all">{hook.url}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">{hook.events} · {hook.is_active ? 'active' : 'inactive'}</p>
                </div>
                <button onClick={() => deleteWebhook(hook.id)} className="text-[var(--danger)] hover:text-[var(--danger)]/70">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
