import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, polygon, arbitrum, base, bsc } from '@reown/appkit/networks';

// Public identifier for this app on WalletConnect's relay network - not a
// secret, safe to be embedded in frontend code (unlike API keys).
export const projectId = 'be9763d6c2da2fba3af8f4445381cbe9';

const metadata = {
  name: 'OS AI',
  description: 'OS AI - Multi-chain non-custodial asset hub',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://osai.io',
  icons: [],
};

export const networks = [polygon, mainnet, arbitrum, base, bsc];

createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  defaultNetwork: polygon,
  metadata,
  projectId,
  features: {
    analytics: false,
  },
});
