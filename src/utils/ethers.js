import { ethers } from 'ethers';
import { api } from './api';

const CLOSE_ABI = [
  "function burn(uint256 amount) external"
];

export const getProvider = (chain = 'polygon') => {
  const rpcMap = {
    polygon: import.meta.env.VITE_POLYGON_RPC || 'https://polygon-rpc.com',
    ethereum: import.meta.env.VITE_ETHEREUM_RPC || 'https://eth.llamarpc.com',
    bsc: import.meta.env.VITE_BSC_RPC || 'https://bsc-dataseed.binance.org',
    arbitrum: import.meta.env.VITE_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    base: import.meta.env.VITE_BASE_RPC || 'https://mainnet.base.org',
  };
  return new ethers.providers.JsonRpcProvider(rpcMap[chain] || rpcMap.polygon);
};

export const decryptSeed = async (encryptedSeed, password) => {
  try {
    const wallet = await ethers.Wallet.fromEncryptedJson(encryptedSeed, password);
    return wallet;
  } catch (e) {
    throw new Error('Invalid password or corrupted seed');
  }
};

export const signBurn = async (encryptedSeed, password, contractAddress, amount, chain = 'polygon') => {
  const wallet = await decryptSeed(encryptedSeed, password);
  const provider = getProvider(chain);
  const signer = wallet.connect(provider);
  const contract = new ethers.Contract(contractAddress, CLOSE_ABI, signer);
  const tx = await contract.populateTransaction.burn(amount);
  const signedTx = await signer.signTransaction(tx);
  return signedTx;
};

export const signSend = async (encryptedSeed, password, to, amount, tokenAddress = null, chain = 'polygon') => {
  const wallet = await decryptSeed(encryptedSeed, password);
  const provider = getProvider(chain);
  const signer = wallet.connect(provider);
  let tx;
  if (tokenAddress) {
    const erc20Abi = [
      "function transfer(address to, uint256 amount) external returns (bool)"
    ];
    const contract = new ethers.Contract(tokenAddress, erc20Abi, signer);
    tx = await contract.populateTransaction.transfer(to, amount);
  } else {
    tx = {
      to,
      value: amount,
    };
  }
  const signedTx = await signer.signTransaction(tx);
  return signedTx;
};

export const broadcastTx = async (signedTx, chain = 'polygon') => {
  const res = await api.post('/wallet/broadcast', { signed_tx: signedTx, chain });
  return res.data;
};
