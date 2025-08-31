"use client";
import { motion } from "motion/react";
import Image from "next/image";

export interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
  blurb?: string;
  linkedin?: string;
}

interface TeamSectionProps {
  heading?: string;
  members?: TeamMember[];
}

export function TeamSection({
  heading = "Focused, product-obsessed team",
  members = [
    { name: "Dina K.", role: "Full Stack Engineer", blurb: "Building transparent financial tools." },
    { name: "Keshav A M.", role: "Product Manager", blurb: "Simplifying complex cap table math." },
    { name: "Sanjay K.", role: "UI/UX Designer", blurb: "Crafting clarity-first UI." },
  ],
}: TeamSectionProps) {
  return (
    <section id="team" className="py-20 md:py-28">
      <div className="container mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight md:text-4xl"
          >
            {heading}
          </motion.h2>
          <p className="mt-3 text-muted-foreground text-sm md:text-base">We keep the core team lean so the product ships fast & stays founder-focused.</p>
        </div>
  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {members.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="relative rounded-2xl border border-border/50 bg-muted/40 dark:bg-background/50 p-8 text-center backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-semibold text-white shadow-lg ring-4 ring-background/50">
                {m.avatar ? (
                  <Image src={m.avatar} alt={m.name} width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  m.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                )}
              </div>
              <h3 className="text-base font-semibold tracking-tight">{m.name}</h3>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-primary/80">{m.role}</p>
              {m.blurb && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-[240px] mx-auto">{m.blurb}</p>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 dark:ring-white/10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
