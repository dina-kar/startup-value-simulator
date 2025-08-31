"use client";

import { motion } from "motion/react";
import { Edit3, DollarSign, Percent, BadgeDollarSign } from "lucide-react";

interface DemoRound {
  order: number;
  name: string;
  type: 'SAFE' | 'Priced';
  amount: number;
  preMoney?: number;
  postMoney?: number;
  sharePrice?: number;
  valuationCap?: number;
  discount?: number;
}

const demoRounds: DemoRound[] = [
  { order: 1, name: 'Seed SAFE', type: 'SAFE', amount: 750000, valuationCap: 6000000, discount: 20 },
  { order: 2, name: 'Series A', type: 'Priced', amount: 6000000, preMoney: 18000000, postMoney: 24000000, sharePrice: 1.25 },
];

const formatCurrency = (amount?: number) => amount == null
  ? 'N/A'
  : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

const formatPct = (v?: number) => v == null ? '—' : `${v}%`;

export function RoundModelingPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative w-full max-w-lg mx-auto lg:mx-0"
    >
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30 blur-xl opacity-60 animate-gradient-float" />
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background/90 to-muted/40 p-5 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BadgeDollarSign className="h-4 w-4 text-primary" />
            Funding Rounds (Demo)
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full border bg-muted/60 dark:bg-background/50 uppercase tracking-wide font-medium">Read‑only</span>
        </div>
        <ul className="space-y-4">
          {demoRounds.map(r => (
            <li key={r.order} className="rounded-xl border bg-card/60 dark:bg-card/30 p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                    {r.order}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm md:text-base tracking-tight flex items-center gap-2">
                      {r.name}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide border ${r.type === 'SAFE' ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300 border-green-300/40 dark:border-green-500/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-blue-300/40 dark:border-blue-500/30'}`}>{r.type}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Amount: {formatCurrency(r.amount)}</p>
                  </div>
                </div>
                <button type="button" className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/70 hover:text-foreground transition-colors rounded-md px-2 py-1 border bg-background/40" disabled>
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-[11px] md:text-xs">
                {r.type === 'Priced' ? (
                  <>
                    <Info label="Pre-Money" value={formatCurrency(r.preMoney)} icon={<DollarSign className="h-3 w-3" />} />
                    <Info label="Post-Money" value={formatCurrency(r.postMoney)} icon={<DollarSign className="h-3 w-3" />} />
                    <Info label="Share Price" value={r.sharePrice ? `$${r.sharePrice.toFixed(2)}` : 'TBD'} />
                    <Info label="Issued" value={r.sharePrice ? Math.round(r.amount / r.sharePrice).toLocaleString() : 'TBD'} />
                  </>
                ) : (
                  <>
                    <Info label="Valuation Cap" value={formatCurrency(r.valuationCap)} icon={<DollarSign className="h-3 w-3" />} />
                    <Info label="Discount" value={formatPct(r.discount)} icon={<Percent className="h-3 w-3" />} />
                    <Info label="MFN" value="No" />
                    <Info label="Status" value="Convertible" />
                  </>
                )}
              </div>
              <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-600/5 to-indigo-600/5" />
            </li>
          ))}
        </ul>
        <div className="mt-6 grid grid-cols-3 gap-3 text-[10px] md:text-[11px]">
          {[{ k: 'Founders', v: '62.5%' }, { k: 'Investors', v: '24.5%' }, { k: 'ESOP', v: '13%' }].map(s => (
            <div key={s.k} className="rounded-lg border bg-muted/40 dark:bg-background/40 p-2 text-center">
              <p className="font-semibold text-[12px] tracking-tight">{s.v}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5 uppercase tracking-wide">{s.k}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl p-4 bg-gradient-to-br from-blue-600/15 to-indigo-600/15 border text-[11px] leading-relaxed">
          Exit @ $180M → Founders <span className="font-semibold">$112.5M</span>, Investors <span className="font-semibold">$44.1M</span>, ESOP <span className="font-semibold">$23.4M</span>
        </div>
      </div>
    </motion.div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background/40 dark:bg-background/30 p-2">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-medium text-muted-foreground mb-0.5">
        {icon}
        {label}
      </p>
      <p className="text-[11px] font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
