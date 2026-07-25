import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

// Live wallet + market ticker strip. Falls back to a static status row
// if no market feed is wired up yet — replace the `items` fallback below
// once /market/ticker is connected on the backend.
export function TickerRail() {
  const { totalUsd } = useWallet();

  const items = [
    { label: 'WALLET', value: `$${totalUsd.toFixed(2)}`, delta: null },
    { label: 'BASE', value: 'connected', delta: null },
  ];
  const row = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-line bg-panel2 h-9 flex items-center">
      <div className="flex gap-8 whitespace-nowrap animate-ticker pl-4">
        {row.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[12px] font-mono shrink-0">
            <span className="text-muted">{t.label}</span>
            <span className="text-bone">{t.value}</span>
            {t.delta && (
              <span className={`flex items-center gap-0.5 ${t.up ? 'text-teal' : 'text-alert'}`}>
                {t.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {t.delta}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
