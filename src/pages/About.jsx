import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { OsAiMark } from '../components/ui/OsAiMark';

export default function About() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="os-info-page min-h-full p-4 tablet:p-6 space-y-6 max-w-4xl">
      <div className="os-info-hero">
        <div className="os-info-hero-mark">
          <OsAiMark size={38} animated={false} />
        </div>

        <div>
          <div className="os-page-eyebrow">THE OS AI ECOSYSTEM</div>
          <h1 className="text-3xl tablet:text-4xl font-display font-bold text-[var(--text-primary)]">
            About OS AI
          </h1>
          <p className="os-page-subtitle">
            Intelligence, connected.
          </p>
        </div>
      </div>

      <div className="glass-card os-info-card p-6 space-y-6">
        <section>
          <h2 className="text-xl font-display font-semibold text-[var(--text-primary)] mb-3">
            Intelligence built for the real world
          </h2>
          <p className="text-[var(--text-secondary)] leading-7">
            OS AI is a modern intelligence platform designed to bring
            powerful AI capabilities, digital infrastructure, and financial
            technology into one connected ecosystem.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-[var(--text-primary)] mb-3">
            One ecosystem. Multiple capabilities.
          </h2>
          <p className="text-[var(--text-secondary)] leading-7">
            OS AI provides an intelligent workspace for research, creation,
            problem-solving, and decision-making. OS Vault extends the
            ecosystem with non-custodial digital asset infrastructure,
            allowing users to manage supported assets and interact with
            blockchain-based services from within the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-[var(--text-primary)] mb-3">
            The role of CLOSE
          </h2>
          <p className="text-[var(--text-secondary)] leading-7">
            CLOSE is an infrastructure asset within the OS AI ecosystem.
            It is designed to support utility across connected services,
            including transfers, in-app interactions, and other blockchain
            functionality as the platform evolves.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold text-[var(--text-primary)] mb-3">
            Built by Goldx Technologies
          </h2>
          <p className="text-[var(--text-secondary)] leading-7">
            OS AI is developed by Goldx Technologies, a technology company
            focused on building intelligent software, digital infrastructure,
            and practical tools for the next generation of connected users.
          </p>
        </section>

        <section className="pt-2 border-t border-[var(--glass-border)]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="os-page-eyebrow mb-1">PLATFORM</div>
              <div className="text-[var(--text-primary)] font-medium">OS AI</div>
            </div>

            <div>
              <div className="os-page-eyebrow mb-1">INFRASTRUCTURE</div>
              <div className="text-[var(--text-primary)] font-medium">OS Vault</div>
            </div>

            <div>
              <div className="os-page-eyebrow mb-1">ECOSYSTEM ASSET</div>
              <div className="text-[var(--text-primary)] font-medium">CLOSE</div>
            </div>
          </div>
        </section>

        <div className="text-sm text-[var(--text-muted)] pt-2">
          OS AI · Built for intelligence, infrastructure, and utility.
        </div>
      </div>
    </div>
  );
}
