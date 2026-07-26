import { ethers } from 'ethers';
import { api } from './api';

// CLOSE contract ABI (only the burn function)
const CLOSE_ABI = [
  "function burn(uint256 amount) external"
];

// Provider (use Alchemy or public RPC)
const getProvider = (chain = 'polygon') => {
  const rpcMap = {
    polygon: import.meta.env.VITE_POLYGON_RPC || 'https://polygon-rpc.com',
    ethereum: import.meta.env.VITE_ETHEREUM_RPC || 'https://eth.llamarpc.com',
    bsc: import.meta.env.VITE_BSC_RPC || 'https://bsc-dataseed.binance.org',
    arbitrum: import.meta.env.VITE_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    base: import.meta.env.VITE_BASE_RPC || 'https://mainnet.base.org',
  };
  return new ethers.providers.JsonRpcProvider(rpcMap[chain] || rpcMap.polygon);
};

/**
 * Decrypt the encrypted seed with the user's password.
 */
export const decryptSeed = async (encryptedSeed, password) => {
  try {
    const wallet = await ethers.Wallet.fromEncryptedJson(encryptedSeed, password);
    return wallet;
  } catch (e) {
    throw new Error('Invalid password or corrupted seed');
  }
};

/**
 * Sign a burn transaction for CLOSE token.
 */
export const signBurn = async (encryptedSeed, password, contractAddress, amount, chain = 'polygon') => {
  const wallet = await decryptSeed(encryptedSeed, password);
  const provider = getProvider(chain);
  const signer = wallet.connect(provider);
  const contract = new ethers.Contract(contractAddress, CLOSE_ABI, signer);
  const tx = await contract.populateTransaction.burn(amount);
  const signedTx = await signer.signTransaction(tx);
  return signedTx;
};

/**
 * Sign a generic send transaction (native or token).
 */
export const signSend = async (encryptedSeed, password, to, amount, tokenAddress = null, chain = 'polygon') => {
  const wallet = await decryptSeed(encryptedSeed, password);
  const provider = getProvider(chain);
  const signer = wallet.connect(provider);
  let tx;
  if (tokenAddress) {
    // ERC-20 transfer
    const erc20Abi = [
      "function transfer(address to, uint256 amount) external returns (bool)"
    ];
    const contract = new ethers.Contract(tokenAddress, erc20Abi, signer);
    tx = await contract.populateTransaction.transfer(to, amount);
  } else {
    // Native transfer (POL/ETH/BNB)
    tx = {
      to,
      value: amount,
    };
  }
  const signedTx = await signer.signTransaction(tx);
  return signedTx;
};

/**
 * Broadcast a signed transaction to the backend.
 */
export const broadcastTx = async (signedTx, chain = 'polygon') => {
  const res = await api.post('/wallet/broadcast', { signed_tx: signedTx, chain });
  return res.data;
};