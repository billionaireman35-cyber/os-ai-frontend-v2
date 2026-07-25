import { useState, useEffect } from 'react';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { Core } from '@walletconnect/core';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { ethers } from 'ethers';
import { signSend, broadcastTx } from '../utils/ethers';

export function WalletConnectButton() {
    const { user } = useAuth();
    const [web3wallet, setWeb3wallet] = useState(null);
    const [connected, setConnected] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initialize WalletConnect
    useEffect(() => {
        if (!user) return;
        const initWallet = async () => {
            const core = new Core({
                projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your_project_id',
            });
            const wallet = await Web3Wallet.init({
                core,
                metadata: {
                    name: 'OS AI',
                    description: 'OS AI Wallet',
                    url: 'https://osai.io',
                    icons: [],
                },
            });
            setWeb3wallet(wallet);
            // Handle session proposal events
            wallet.on('session_proposal', async (proposal) => {
                // Approve automatically (or we can prompt user)
                const session = await wallet.approveSession({
                    id: proposal.id,
                    namespaces: {
                        eip155: {
                            accounts: [`eip155:137:${user.wallet_address}`],
                            methods: ['eth_sendTransaction', 'eth_sign'],
                            events: ['chainChanged', 'accountsChanged'],
                        },
                    },
                });
                // Store session on backend
                await api.post('/wc/session', {
                    topic: session.topic,
                    dapp_name: session.peer.metadata.name,
                    dapp_url: session.peer.metadata.url,
                    chain_id: 137,
                    accounts: [`eip155:137:${user.wallet_address}`],
                });
                fetchSessions();
                setConnected(true);
            });
            // Handle signing requests
            wallet.on('session_request', async (event) => {
                // We'll handle signing here
                const { id, params } = event;
                const request = params.request;
                const chainId = params.chainId;
                if (request.method === 'eth_sendTransaction') {
                    const tx = request.params[0];
                    // We need to sign and broadcast
                    const password = prompt('Enter your wallet password to sign this transaction:');
                    if (!password) return;
                    // ... sign and broadcast using user's wallet
                } else if (request.method === 'eth_sign') {
                    const message = request.params[1];
                    // Sign message
                }
            });
            // Fetch existing sessions
            fetchSessions();
        };
        initWallet();
    }, [user]);

    const fetchSessions = async () => {
        if (!user) return;
        try {
            const res = await api.get('/wc/sessions');
            setSessions(res.data);
            setConnected(res.data.length > 0);
        } catch (e) {
            console.error(e);
        }
    };

    const connect = async () => {
        if (!web3wallet) return;
        setLoading(true);
        try {
            const { uri, approval } = await web3wallet.connect({
                pairingTopic: '',
                requiredNamespaces: {
                    eip155: {
                        methods: ['eth_sendTransaction', 'eth_sign'],
                        chains: ['eip155:137'],
                        events: ['chainChanged', 'accountsChanged'],
                    },
                },
            });
            // Open WalletConnect modal to display QR code
            // For now, we'll just log the URI
            console.log('WalletConnect URI:', uri);
            // We need to open a modal or deep link – we'll use a library
            // For simplicity, we'll use a QR code modal.
            // We'll implement using @walletconnect/modal
            // But for now, we'll just alert the URI
            alert(`Connect using WalletConnect: ${uri}`);
            const session = await approval();
            // Store session
            await api.post('/wc/session', {
                topic: session.topic,
                dapp_name: session.peer.metadata.name,
                dapp_url: session.peer.metadata.url,
                chain_id: 137,
                accounts: session.namespaces.eip155.accounts,
            });
            fetchSessions();
            setConnected(true);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async (topic) => {
        await web3wallet?.disconnectSession({ topic });
        await api.delete(`/wc/session/${topic}`);
        fetchSessions();
    };

    if (!user) return null;

    return (
        <div className="relative">
            <button
                onClick={connect}
                disabled={loading}
                className="bg-brass/20 hover:bg-brass/30 text-brass text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target"
            >
                {loading ? 'Connecting…' : 'WalletConnect'}
            </button>
            {connected && (
                <div className="absolute right-0 mt-2 w-64 bg-panel2 border border-line rounded-lg shadow-lg p-2 z-50">
                    <p className="text-[11px] text-muted font-mono uppercase tracking-wide px-2 py-1">Active Sessions</p>
                    {sessions.map((s) => (
                        <div key={s.topic} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-md">
                            <span className="text-[12px] text-bone">{s.dapp_name}</span>
                            <button
                                onClick={() => disconnect(s.topic)}
                                className="text-[10px] text-alert hover:underline"
                            >
                                Disconnect
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}