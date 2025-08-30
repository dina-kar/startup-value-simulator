"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { CardFlip } from "./CardFlip";
import { ChartColumn } from "lucide-react";
interface FeatureItem {
  icon: ReactNode;
  title: string;
  desc: string;
}

interface FeatureGridProps {
  features?: FeatureItem[];
}

// MVPBlocks-like spotlight / feature grid
export function FeatureGrid({
  features = [
    {
      icon: <span className="w-6 h-6"><ChartColumn /></span>,
      title: "Cap Table Modeling",
      desc: "Model multiple rounds & watch real-time dilution.",
    },
    {
      icon: <span className="text-3xl">💰</span>,
      title: "Exit Scenarios",
      desc: "Simulate exits & waterfall distributions instantly.",
    },
    {
      icon: <span className="text-3xl">👥</span>,
      title: "Founder Focus",
      desc: "Purpose-built to explain equity & decision tradeoffs.",
    },
  ],
}: FeatureGridProps) {
  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto max-w-5xl px-6">
        <div className="grid place-items-center gap-10 sm:grid-cols-2 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <CardFlip
                title={f.title}
                description={f.desc}
                icon={f.icon}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
