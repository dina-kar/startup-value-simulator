"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextReveal } from "./TextReveal";

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
  <section className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.blue.200/_0.35)_0%,transparent_65%)] dark:bg-[radial-gradient(circle_at_center,theme(colors.blue.900/_0.6)_0%,transparent_65%)]" />
      <div className="container relative mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <TextReveal
          text={title}
          as="h1"
          className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl"
          delayPerWord={0.06}
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          {subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
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
      </div>
    </section>
  );
}
