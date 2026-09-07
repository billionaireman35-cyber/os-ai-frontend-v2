import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function PrivacyTerms() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="os-info-page min-h-full p-4 tablet:p-6 space-y-6 max-w-4xl">
      <div className="os-info-hero">
        <div className="os-info-hero-mark os-info-hero-mark-document">
          <span>§</span>
        </div>

        <div>
          <p className="os-page-eyebrow">TRUST & TRANSPARENCY</p>
          <h1 className="text-3xl tablet:text-4xl font-display font-bold text-[var(--text-primary)]">
            Privacy & Terms
          </h1>
          <p className="os-page-subtitle">
            Clear principles for using OS AI and its connected services.
          </p>
        </div>
      </div>

      <div className="glass-card os-info-card os-legal-card p-6 space-y-8">

        <section>
          <div className="os-page-eyebrow mb-2">01 · PRIVACY</div>
          <h2 className="text-2xl font-display font-semibold text-[var(--text-primary)] mb-3">
            Privacy Policy
          </h2>

          <p className="text-[var(--text-secondary)] leading-7">
            OS AI is designed with privacy and responsible data handling in
            mind. We aim to collect and process information only where it is
            needed to provide, secure, maintain, and improve the services.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Information we may process
          </h3>
          <ul className="os-legal-list">
            <li>Account information such as your name and email address.</li>
            <li>Authentication and security information required to protect your account.</li>
            <li>Information you voluntarily provide while using OS AI.</li>
            <li>AI conversations and workspace content needed to provide requested functionality.</li>
            <li>Wallet and blockchain information required to provide wallet-related features and transactions.</li>
            <li>Technical information such as device, browser, network, and diagnostic information where required for security and service operation.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            How information is used
          </h3>
          <ul className="os-legal-list">
            <li>To authenticate users and maintain account security.</li>
            <li>To provide AI, wallet, workspace, and other requested services.</li>
            <li>To process and display blockchain transactions and related activity.</li>
            <li>To prevent abuse, fraud, unauthorized access, and security incidents.</li>
            <li>To diagnose technical problems and improve reliability.</li>
            <li>To comply with applicable legal obligations.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            AI conversations and memory
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            Information provided to OS AI may be processed to generate
            responses and provide features you request. Where the platform
            provides memory or personalization controls, those features may
            use information associated with your account according to the
            settings and functionality available in the application.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Wallets and blockchain data
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            Blockchain networks are public systems. Wallet addresses,
            transaction hashes, token transfers, and other on-chain activity
            may therefore be publicly visible and may not be erasable from
            the blockchain. OS Vault is intended to provide non-custodial
            wallet functionality, but users remain responsible for protecting
            their recovery information and controlling their transactions.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Security
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            We use reasonable technical and organizational measures intended
            to protect information and accounts. No internet service,
            software system, or blockchain network can guarantee absolute
            security. Users should protect passwords, recovery phrases,
            private keys, authentication credentials, and devices used to
            access the platform.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Third-party services
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            OS AI may rely on third-party infrastructure, authentication
            providers, blockchain networks, APIs, analytics, hosting,
            payment or other technology services. Those services may process
            information according to their own terms and privacy policies.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Data retention and deletion
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            Information may be retained for as long as reasonably necessary
            to provide the services, maintain security, resolve disputes,
            comply with legal obligations, or maintain legitimate business
            records. Blockchain records are controlled by the underlying
            networks and generally cannot be deleted by OS AI.
          </p>
        </section>

        <section className="pt-2 border-t border-[var(--glass-border)]">
          <div className="os-page-eyebrow mb-2">02 · TERMS</div>
          <h2 className="text-2xl font-display font-semibold text-[var(--text-primary)] mb-3">
            Terms of Service
          </h2>

          <p className="text-[var(--text-secondary)] leading-7">
            By accessing or using OS AI, you agree to use the platform
            responsibly and in accordance with applicable laws and these
            terms.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Using OS AI
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            OS AI provides software and digital services for intelligence,
            productivity, communication, wallet functionality, and connected
            ecosystem features. Features may change, be improved, suspended,
            or discontinued as the platform develops.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            OS Vault responsibilities
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            Users are responsible for securing their wallet credentials,
            recovery information, private keys, and devices. Transactions
            submitted to blockchain networks may be irreversible. Always
            verify addresses, networks, amounts, and transaction details
            before confirming a transaction.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            CLOSE
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            CLOSE is an ecosystem infrastructure asset intended to support
            utility within connected OS AI services. Nothing on this
            platform should be interpreted as a promise of appreciation,
            investment return, or financial performance. Digital assets can
            be highly volatile and may involve substantial risk of loss.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No financial or investment advice
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            Information, market data, AI-generated responses, token
            information, and other material provided through OS AI are for
            informational and technological purposes. They are not a
            substitute for professional financial, legal, tax, or investment
            advice.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Prohibited use
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            Users must not use OS AI to violate applicable laws, compromise
            accounts or systems, conduct fraud, distribute malicious
            software, abuse other users, or interfere with the security or
            availability of the platform.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Availability and third-party networks
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            OS AI may depend on internet services, cloud infrastructure,
            blockchain networks, APIs, and other external systems. Outages,
            congestion, software failures, network upgrades, smart contract
            issues, or events outside our control may affect availability or
            transaction execution.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Intellectual property
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            OS AI, its software, interface, branding, visual assets, and
            associated technology are protected by applicable intellectual
            property laws. Except where expressly permitted, users may not
            copy, modify, distribute, reverse engineer, or commercially
            exploit protected platform materials.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Limitation of responsibility
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            To the extent permitted by applicable law, users understand that
            digital services and blockchain systems involve technical,
            operational, security, and market risks. Users should independently
            verify important information and transaction details before acting.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Changes to these terms
          </h3>
          <p className="text-[var(--text-secondary)] leading-7">
            These policies may be updated as OS AI evolves, new functionality
            is introduced, or legal requirements change. The latest version
            displayed within the application will govern continued use of
            the relevant services.
          </p>
        </section>

        <section className="pt-4 border-t border-[var(--glass-border)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="os-page-eyebrow mb-1">PLATFORM</div>
              <div className="text-[var(--text-primary)] font-medium">
                OS AI
              </div>
            </div>

            <div>
              <div className="os-page-eyebrow mb-1">TECHNOLOGY</div>
              <div className="text-[var(--text-primary)] font-medium">
                Goldx Technologies
              </div>
            </div>
          </div>
        </section>

        <p className="text-[var(--text-muted)] text-sm font-mono">
          Last updated: September 2026
        </p>
      </div>
    </div>
  );
}
