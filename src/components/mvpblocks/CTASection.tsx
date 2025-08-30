"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  title?: string;
  desc?: string;
  cta?: { label: string; href: string };
}

export function CTASection({
  title = "Ready to model your startup?",
  desc = "Start with your founding team & ESOP, then add rounds to see ownership & exit outcomes.",
  cta = { label: "Create Your Account", href: "/auth/signup" },
}: CTASectionProps) {
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background to-muted/40 p-10 text-center shadow backdrop-blur supports-[backdrop-filter]:bg-background/70"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,theme(colors.blue.400/_0.15),transparent_70%)]" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-sm text-muted-foreground md:text-base">
            {desc}
          </p>
          <div className="mt-8 flex justify-center">
            <Link href={cta.href}>
              <Button size="lg" className="h-11 px-8 font-medium">
                {cta.label}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
