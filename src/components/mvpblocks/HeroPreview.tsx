"use client";

import { motion } from "motion/react";
import { ChartColumn, Users2, Shuffle, Percent } from "lucide-react";

// Stylized preview card showing a faux cap table & exit metrics
export function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.25 }}
      className="relative w-full max-w-lg mx-auto lg:mx-0"
    >
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-600/30 blur-xl opacity-60 animate-gradient-float" />
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background/90 to-muted/40 p-5 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ChartColumn className="h-4 w-4 text-primary" />
            Round Modeling
          </div>
          <div className="flex -space-x-2">
            {[0,1,2].map(i => (
              <span key={i} className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-[10px] flex items-center justify-center text-white shadow ring-2 ring-background">
                {(i===0?'DK':i===1?'AR':'PS')}
              </span>
            ))}
          </div>
        </div>
        <ul className="space-y-2">
          {[
            { label: 'Founders', value: '62.5%', icon: Users2, color: 'from-blue-500 to-indigo-500' },
            { label: 'ESOP (Post)', value: '13%', icon: Percent, color: 'from-purple-500 to-fuchsia-500' },
            { label: 'Investors', value: '24.5%', icon: Shuffle, color: 'from-emerald-500 to-teal-500' },
          ].map((row) => (
            <li key={row.label} className="relative overflow-hidden rounded-lg border bg-card/60 dark:bg-card/30 p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`h-6 w-6 rounded-md bg-gradient-to-br ${row.color} text-[11px] font-semibold text-white flex items-center justify-center`}>{row.value.split('%')[0]}</span>
                <span className="text-muted-foreground/90">{row.label}</span>
              </div>
              <span className="font-medium tracking-tight text-foreground">{row.value}</span>
              <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-600/5 to-indigo-600/5" />
            </li>
          ))}
        </ul>
        <div className="mt-5 grid grid-cols-3 gap-3 text-[11px]">
          {[
            { k: 'Pre Money', v: '$18M' },
            { k: 'Round', v: '$6M' },
            { k: 'Post Money', v: '$24M' },
          ].map(stat => (
            <div key={stat.k} className="rounded-lg border bg-muted/40 dark:bg-background/40 p-2 text-center">
              <p className="font-semibold text-[12px] tracking-tight">{stat.v}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5 uppercase tracking-wide">{stat.k}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl p-4 bg-gradient-to-br from-blue-600/15 to-indigo-600/15 border text-xs leading-relaxed">
          Exit @ $180M → Founders receive <span className="font-semibold">$112.5M</span>, Investors <span className="font-semibold">$44.1M</span>, ESOP <span className="font-semibold">$23.4M</span>
        </div>
        <div className="mt-4 flex justify-end">
          <span className="text-[10px] px-2 py-1 rounded-md bg-muted/60 dark:bg-background/60 border font-medium tracking-wide">Live Preview</span>
        </div>
      </div>
    </motion.div>
  );
}
