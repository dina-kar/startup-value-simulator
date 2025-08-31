"use client";

import { motion } from "motion/react";

interface StatItem {
  label: string;
  value: string;
  hint?: string;
}

interface StatsBarProps {
  stats?: StatItem[];
}

// Thin metrics / social proof strip
export function StatsBar({
  stats = [
    { value: "<1s", label: "Scenario calc latency", hint: "Reactive engine" },
    { value: "100%", label: "Auditable math", hint: "Transparent formulas" },
    { value: "0", label: "Spreadsheets needed", hint: "All-in-one" },
    { value: "∞", label: "What-if rounds", hint: "Iterate freely" },
  ],
}: StatsBarProps) {
  return (
    <section className="relative border-y bg-gradient-to-b from-muted/40 to-background dark:from-background/40 dark:to-background/80 py-6 md:py-8 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.blue.500/0.08),transparent_70%)]" />
      <div className="container mx-auto max-w-6xl px-6">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((s, i) => (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/60 dark:bg-card/30 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/30"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-blue-600/10 to-indigo-600/10" />
              <p className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
                {s.label}
              </p>
              {s.hint && <p className="mt-1 text-[11px] text-muted-foreground/70">{s.hint}</p>}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
