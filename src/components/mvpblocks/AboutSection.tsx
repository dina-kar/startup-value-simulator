"use client";

import { motion } from "motion/react";

export interface AboutSectionProps {
  heading?: string;
  tagline?: string;
  points?: { title: string; desc: string }[];
}

export function AboutSection({
  heading = "Why another cap table tool?",
  tagline = "We built a modeling engine that is transparent, fast, and founder‑centric so you can understand dilution before it's irreversible.",
  points = [
    { title: "Transparent Math", desc: "Every round calculation is auditable – no black box spreadsheets." },
    { title: "Scenario Speed", desc: "Change a number, see ownership + exit outcomes instantly (<1s)." },
    { title: "Founder Outcomes", desc: "Model secondaries, ESOP top‑ups & SAFE conversions side‑by‑side." },
  ],
}: AboutSectionProps) {
  return (
    <section id="about" className="relative scroll-mt-16 py-20 md:py-28">
      <div className="container mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight md:text-4xl"
          >
            {heading}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            {tagline}
          </motion.p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.06 * i }}
              className="relative rounded-xl border border-border/50 bg-muted/40 dark:bg-background/50 p-6 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-base font-semibold tracking-tight mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 dark:ring-white/10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
