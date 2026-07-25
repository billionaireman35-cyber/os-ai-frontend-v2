import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';

export default function About() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <h1 className="font-display text-2xl text-bone">About OS AI</h1>
      <div className="ledger-card p-6 max-w-3xl">
        <p className="text-bone text-[15px] leading-relaxed">
          OS AI is the Operating System for Intelligence – a sovereign AI assistant with embedded blockchain capabilities.
          Built by CLOSEAI Technologies under CEO Osinachi Chukwu, OS AI combines a general-purpose AI (expert in all domains)
          with a multi-chain non-custodial wallet, staking, swap, and bridge features.
        </p>
        <p className="text-bone text-[15px] leading-relaxed mt-4">
          Every AI interaction burns CLOSE tokens, creating deflationary pressure. Users earn CLOSE by staking and participating
          in the ecosystem. The wallet supports Bitcoin, Ethereum, Polygon, BSC, Arbitrum, and Base.
        </p>
        <p className="text-bone text-[15px] leading-relaxed mt-4">
          Version: 3.0.0 &bull; Released: July 2026
        </p>
      </div>
    </div>
  );
}