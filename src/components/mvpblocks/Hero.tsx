"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextReveal } from "./TextReveal";
import { RoundModelingPreview } from "./RoundModelingPreview";

interface HeroProps {
  title?: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

// Minimal MVPBlocks-inspired hero block
export function Hero({
  title = "Startup Value Simulator",
  subtitle = "Model cap tables across funding rounds and instantly see founder outcomes across exit scenarios.",
  primaryCta = { label: "Get Started", href: "/auth/signup" },
  secondaryCta = { label: "Sign In", href: "/auth/login" },
}: HeroProps) {
  return (
    <section className="relative overflow-hidden pb-12 pt-28 md:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.blue.400/_0.25)_0%,transparent_65%)] dark:bg-[radial-gradient(circle_at_top,theme(colors.blue.900/_0.55)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-40 mix-blend-overlay" />
      <div className="container relative mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 items-center gap-16">
          <div className="relative text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1 text-xs font-medium tracking-wide shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <span className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
              Live Modeling Engine
            </div>
            <TextReveal
              text={title}
              as="h1"
              className="mt-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-4xl font-extrabold tracking-tight text-black sm:text-5xl md:text-6xl"
              delayPerWord={0.05}
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl mx-auto lg:mx-0"
            >
              {subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              <Link href={primaryCta.href}>
                <Button size="lg" className="h-12 px-8 text-base font-medium">
                  {primaryCta.label} →
                </Button>
              </Link>
              <Link href={secondaryCta.href}>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium">
                  {secondaryCta.label}
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-muted-foreground"
            >
              {["Unlimited what‑ifs", "SAFE ↔ Equity", "Waterfall exits", "Audit drawer"].map(tag => (
                <span key={tag} className="rounded-full border bg-muted/40 dark:bg-background/40 px-3 py-1 font-medium backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
          <RoundModelingPreview />
        </div>
      </div>
    </section>
  );
}
