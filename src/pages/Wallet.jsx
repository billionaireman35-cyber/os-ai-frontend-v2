import { useState, useEffect } from 'react';
import { ShieldCheck, Users, Send, ArrowUpDown, Lock, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { signSend, broadcastTx } from '../utils/ethers';
import { ethers } from 'ethers';
import { SwapModal } from '../components/modal/SwapModal';

const NATIVE_SYMBOLS = { polygon: 'POL', ethereum: 'ETH', bsc: 'BNB', arbitrum: 'ETH', base: 'ETH' };

function SendModal({ isOpen, onClose, asset, onSent }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !asset) return null;

  const handleSend = async () => {
    setError('');
    if (!to || !amount || !password) {
      setError('All fields are required');
      return;
    }
    setSending(true);
    try {
      const seedRes = await api.get('/wallet/seed');
      const encryptedSeed = seedRes.data.encrypted_seed;

      let tokenAddress = null;
      if (asset.symbol === 'CLOSE') {
        tokenAddress = import.meta.env.VITE_CLOSE_CONTRACT;
      } else if (asset.symbol !== NATIVE_SYMBOLS[asset.chain]) {
        throw new Error('Sending this token is not yet supported');
      }

      const amountWei = ethers.utils.parseUnits(amount, 18).toString();
      const signedTx = await signSend(encryptedSeed, password, to, amountWei, tokenAddress, asset.chain);
      await broadcastTx(signedTx, asset.chain);

      onSent();
    } catch (e) {
      setError(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-panel2 border border-line rounded-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[16px] font-display text-bone">Send {asset.symbol}</h3>
          <button onClick={onClose} className="text-muted hover:text-bone">
            <X size={18} />
          </button>
        </div>
        <p className="text-[12px] text-muted">Available: {asset.balance} {asset.symbol}</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 text-[12px] text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div>
          <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Recipient</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
            placeholder="0x..."
          />
        </div>
        <div>
          <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
            placeholder="0.0"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Wallet Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
            placeholder="Enter your wallet password"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 bg-brass hover:bg-brassLight text-void font-semibold rounded-md py-2.5 press-soft touch-target disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-panel border border-line text-muted hover:text-bone rounded-md py-2.5 press-soft touch-target"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function StandardWallet() {
  const { user } = useAuth();
  const { balances, totalUsd, loading, fetchBalances, sendTransaction } = useWallet();
  const [showSend, setShowSend] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (user?.wallet_address) {
      navigator.clipboard.writeText(user.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && balances.length === 0) {
    return <p className="text-muted text-[13px]">Loading balances…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="ledger-card p-4 space-y-3">
        <div>
          <p className="text-[11px] text-muted font-mono uppercase tracking-wide">Total Balance</p>
          <p className="text-[28px] font-display text-bone">${totalUsd.toFixed(2)}</p>
        </div>
        {user?.wallet_address && (
          <div className="flex items-center justify-between bg-panel border border-line rounded-md px-3 py-2">
            <span className="font-mono text-[12px] text-muted truncate">{user.wallet_address}</span>
            <button onClick={handleCopyAddress} className="text-[11px] text-brass shrink-0 ml-2">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setShowSwap(true)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brass hover:bg-brassLight text-void text-[13px] font-semibold rounded-md py-2.5 press-soft touch-target"
          >
            <ArrowUpDown size={14} /> Swap
          </button>
          <button
            onClick={fetchBalances}
            className="flex-1 bg-panel border border-line text-muted hover:text-bone text-[13px] rounded-md py-2.5 press-soft touch-target"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {balances.length === 0 ? (
          <p className="text-muted text-[13px]">No assets found.</p>
        ) : (
          balances.map((asset, i) => (
            <div key={`${asset.chain}-${asset.symbol}-${i}`} className="ledger-card p-4 flex items-center justify-between">
              <div>
                <p className="text-bone text-[14px] font-medium">{asset.symbol}</p>
                <p className="text-muted text-[11px] font-mono uppercase">{asset.chain}</p>
              </div>
              <div className="text-right">
                <p className="text-bone text-[14px] font-mono">{asset.balance}</p>
                <p className="text-muted text-[11px]">${asset.usdValue.toFixed(2)}</p>
              </div>
              <button
                onClick={() => { setSelectedAsset(asset); setShowSend(true); }}
                className="ml-3 text-[11px] bg-brass/20 hover:bg-brass/30 text-brass px-3 py-1.5 rounded-md touch-target"
              >
                <Send size={12} className="inline mr-1" /> Send
              </button>
            </div>
          ))
        )}
      </div>

      <SendModal
        isOpen={showSend}
        onClose={() => setShowSend(false)}
        asset={selectedAsset}
        onSent={() => { setShowSend(false); fetchBalances(); }}
      />
      <SwapModal
        isOpen={showSwap}
        onClose={() => setShowSwap(false)}
        onSwap={() => { setShowSwap(false); fetchBalances(); }}
      />
    </div>
  );
}

function SafeWallet() {
  const { user } = useAuth();
  const [safes, setSafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [selectedSafe, setSelectedSafe] = useState(null);
  const [proposals, setProposals] = useState({});

  const [owners, setOwners] = useState(['']);
  const [threshold, setThreshold] = useState(1);
  const [chain, setChain] = useState('polygon');

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
        value: proposeAmount,
        token: proposeToken,
        chain: proposeChain,
      });
      alert(`Proposal created! Safe tx hash: ${res.data.safe_tx_hash}`);
      setShowPropose(false);
      setProposeTo('');
      setProposeAmount('');
      setSelectedSafe(null);
      fetchSafes();
    } catch (e) {
      alert(e.response?.data?.detail || 'Proposal failed');
    }
  };

  const signProposal = async (txId, safeAddress) => {
    const password = prompt('Enter your wallet password to sign:');
    if (!password) return;
    try {
      const seedRes = await api.get('/wallet/seed');
      const encryptedSeed = seedRes.data.encrypted_seed;
      const proposalsList = proposals[safeAddress] || [];
      const proposal = proposalsList.find(p => p.id === txId);
      if (!proposal) throw new Error('Proposal not found');
      const wallet = await ethers.Wallet.fromEncryptedJson(encryptedSeed, password);
      const signature = await wallet.signMessage(proposal.safe_tx_hash);
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
