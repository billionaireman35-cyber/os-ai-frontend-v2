import { useState, useEffect } from 'react';
import { ShieldCheck, Users, Send, ArrowUpDown, Lock, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { api } from '../utils/api';
import { signSend, broadcastTx } from '../utils/ethers';
import { ethers } from 'ethers';
import { SwapModal } from '../components/modal/SwapModal';

// ... (chains, TOKEN_ADDRESSES, etc.)

function SendModal({ isOpen, onClose, asset, onSent }) {
  // ... (as previously defined)
}

function SafeWallet() {
  const { user } = useAuth();
  const [safes, setSafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [selectedSafe, setSelectedSafe] = useState(null);
  const [proposals, setProposals] = useState({}); // key: safe_address, value: array of proposals

  // Create Safe states
  const [owners, setOwners] = useState(['']);
  const [threshold, setThreshold] = useState(1);
  const [chain, setChain] = useState('polygon');

  // Propose states
  const [proposeTo, setProposeTo] = useState('');
  const [proposeAmount, setProposeAmount] = useState('');
  const [proposeToken, setProposeToken] = useState('native');
  const [proposeChain, setProposeChain] = useState('polygon');

  const fetchSafes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/wallet/safe/list');
      setSafes(res.data.safes || []);
      // Fetch proposals for each safe
      for (const safe of res.data.safes) {
        await fetchProposals(safe.safe_address);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async (safeAddress) => {
    try {
      const res = await api.get(`/wallet/safe/proposals/${safeAddress}`);
      setProposals(prev => ({ ...prev, [safeAddress]: res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSafes();
  }, [user]);

  const createSafe = async () => {
    const filteredOwners = owners.filter(o => o.trim() !== '');
    if (filteredOwners.length === 0 || threshold < 1) return;
    try {
      const res = await api.post('/wallet/safe/create', {
        owners: filteredOwners,
        threshold,
        chain,
      });
      alert(`Safe created at: ${res.data.safe_address}`);
      fetchSafes();
      setShowCreate(false);
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create Safe');
    }
  };

  const proposeTransaction = async () => {
    if (!selectedSafe || !proposeTo || !proposeAmount) return;
    try {
      const res = await api.post('/wallet/safe/propose', {
        safe_address: selectedSafe.safe_address,
        to: proposeTo,
        value: proposeAmount, // wei; we'll convert in UI
        token: proposeToken,
        chain: proposeChain,
      });
      alert(`Proposal created! Safe tx hash: ${res.data.safe_tx_hash}`);
      setShowPropose(false);
      setProposeTo('');
      setProposeAmount('');
      setSelectedSafe(null);
      fetchSafes(); // refresh
    } catch (e) {
      alert(e.response?.data?.detail || 'Proposal failed');
    }
  };

  const signProposal = async (txId, safeAddress) => {
    const password = prompt('Enter your wallet password to sign:');
    if (!password) return;
    try {
      // Get encrypted seed
      const seedRes = await api.get('/wallet/seed');
      const encryptedSeed = seedRes.data.encrypted_seed;
      // Fetch the safe_tx_hash from the proposal
      const proposalsList = proposals[safeAddress] || [];
      const proposal = proposalsList.find(p => p.id === txId);
      if (!proposal) throw new Error('Proposal not found');
      // Sign the safe_tx_hash with ethers
      const wallet = await ethers.Wallet.fromEncryptedJson(encryptedSeed, password);
      const signature = await wallet.signMessage(proposal.safe_tx_hash); // need to include safe_tx_hash in proposal data
      // Send signature to backend
      await api.post('/wallet/safe/sign', { tx_id: txId, signature });
      alert('Signed successfully');
      fetchProposals(safeAddress);
    } catch (e) {
      alert(e.message || 'Signing failed');
    }
  };

  const executeProposal = async (txId, safeAddress) => {
    try {
      await api.post('/wallet/safe/execute', { tx_id: txId });
      alert('Executed successfully');
      fetchProposals(safeAddress);
    } catch (e) {
      alert(e.response?.data?.detail || 'Execution failed');
    }
  };

  if (loading) return <p className="text-muted text-[13px]">Loading Safes…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-[14px] text-bone">Gnosis Safe Multisig</p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-brass hover:bg-brassLight text-void text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target"
        >
          {showCreate ? 'Cancel' : 'Create New Safe'}
        </button>
      </div>

      {showCreate && (
        <div className="ledger-card p-4 space-y-3">
          <div>
            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Chain</label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="w-full bg-panel2 border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
            >
              <option value="polygon">Polygon</option>
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="base">Base</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Owners (one per line)</label>
            <textarea
              rows={3}
              value={owners.join('\n')}
              onChange={(e) => setOwners(e.target.value.split('\n').filter(o => o.trim() !== ''))}
              className="w-full bg-panel2 border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
              placeholder="0x...\n0x..."
            />
          </div>
          <div>
            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Threshold</label>
            <input
              type="number"
              min={1}
              max={owners.length}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value) || 1)}
              className="w-full bg-panel2 border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
            />
          </div>
          <button
            onClick={createSafe}
            className="w-full bg-brass hover:bg-brassLight text-void text-[13px] font-semibold rounded-md py-2.5 press-soft touch-target"
          >
            Deploy Safe
          </button>
        </div>
      )}

      <div className="space-y-4">
        {safes.length === 0 ? (
          <p className="text-muted text-[13px]">No Safes deployed yet.</p>
        ) : (
          safes.map((safe) => (
            <div key={safe.safe_address} className="ledger-card p-4 space-y-3">
              <div className="flex justify-between">
                <p className="font-mono text-bone text-[14px]">{safe.safe_address}</p>
                <span className="text-[11px] text-muted">{safe.chain}</span>
              </div>
              <p className="text-[12px] text-muted">Owners: {safe.owners.length} · Threshold: {safe.threshold}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedSafe(safe);
                    setShowPropose(true);
                  }}
                  className="bg-brass/20 hover:bg-brass/30 text-brass text-[12px] px-3 py-1 rounded-md touch-target"
                >
                  Propose Transaction
                </button>
              </div>

              {/* Proposals list */}
              <div className="mt-2 space-y-2">
                <p className="text-[11px] text-muted font-mono uppercase tracking-wide">Proposals</p>
                {!proposals[safe.safe_address] || proposals[safe.safe_address].length === 0 ? (
                  <p className="text-[12px] text-muted">No proposals yet.</p>
                ) : (
                  proposals[safe.safe_address].map((proposal) => (
                    <div key={proposal.id} className="bg-panel border border-line rounded-md p-3 space-y-1">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted">To: <span className="font-mono text-bone">{proposal.to}</span></span>
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${proposal.status === 'pending' ? 'bg-brass/15 text-brass' : 'bg-teal/15 text-teal'}`}>
                          {proposal.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted">Amount: <span className="font-mono text-bone">{proposal.value}</span></span>
                        <span className="text-muted">Signers: <span className="font-mono text-bone">{proposal.signers.length}/{proposal.threshold}</span></span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {proposal.status === 'pending' && !proposal.signers.includes(user?.wallet_address) && (
                          <button
                            onClick={() => signProposal(proposal.id, safe.safe_address)}
                            className="text-[11px] bg-brass/20 hover:bg-brass/30 text-brass px-2 py-0.5 rounded-md"
                          >
                            Sign
                          </button>
                        )}
                        {proposal.status === 'pending' && proposal.signers.length >= proposal.threshold && (
                          <button
                            onClick={() => executeProposal(proposal.id, safe.safe_address)}
                            className="text-[11px] bg-teal/20 hover:bg-teal/30 text-teal px-2 py-0.5 rounded-md"
                          >
                            Execute
                          </button>
                        )}
                        {proposal.status === 'executed' && (
                          <span className="text-[11px] text-teal flex items-center gap-1">
                            <CheckCircle size={14} /> Executed
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Propose Modal */}
      {showPropose && selectedSafe && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-panel2 border border-line rounded-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-display text-bone">Propose Transaction</h3>
            <p className="text-[12px] text-muted">Safe: {selectedSafe.safe_address.slice(0, 10)}…</p>
            <div>
              <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Recipient</label>
              <input
                type="text"
                value={proposeTo}
                onChange={(e) => setProposeTo(e.target.value)}
                className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
                placeholder="0x..."
              />
            </div>
            <div>
              <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Token</label>
              <select
                value={proposeToken}
                onChange={(e) => setProposeToken(e.target.value)}
                className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
              >
                <option value="native">Native (POL/ETH/BNB)</option>
                <option value="CLOSE">CLOSE</option>
                <option value="OSINA">OSINA</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Amount (in wei)</label>
              <input
                type="text"
                value={proposeAmount}
                onChange={(e) => setProposeAmount(e.target.value)}
                className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
                placeholder="1000000000000000000"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Chain</label>
              <select
                value={proposeChain}
                onChange={(e) => setProposeChain(e.target.value)}
                className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
              >
                <option value="polygon">Polygon</option>
                <option value="ethereum">Ethereum</option>
                <option value="bsc">BSC</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="base">Base</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={proposeTransaction}
                className="flex-1 bg-brass hover:bg-brassLight text-void font-semibold rounded-md py-2.5 press-soft touch-target"
              >
                Propose
              </button>
              <button
                onClick={() => { setShowPropose(false); setSelectedSafe(null); }}
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

export default function Wallet() {
  const [tab, setTab] = useState('standard');

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <div className="flex gap-1 ledger-card p-1 w-fit">
        <button
          onClick={() => setTab('standard')}
          className={`px-4 py-1.5 rounded-md text-[13px] font-medium press-soft touch-target ${
            tab === 'standard' ? 'bg-brass text-void' : 'text-muted hover:text-bone'
          }`}
        >
          Standard
        </button>
        <button
          onClick={() => setTab('safe')}
          className={`px-4 py-1.5 rounded-md text-[13px] font-medium press-soft touch-target flex items-center gap-1.5 ${
            tab === 'safe' ? 'bg-brass text-void' : 'text-muted hover:text-bone'
          }`}
        >
          <ShieldCheck size={14} /> Safe
        </button>
      </div>

      {tab === 'standard' ? <StandardWallet /> : <SafeWallet />}
    </div>
  );
}