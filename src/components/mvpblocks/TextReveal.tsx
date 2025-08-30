"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ElementType } from "react";

interface TextRevealProps {
  text: string;
  className?: string;
  as?: ElementType;
  delayPerWord?: number; // seconds
  delayInitial?: number; // seconds
}

/**
 * TextReveal animates words sequentially with a slight upward fade.
 */
export function TextReveal({
  text,
  className,
  as = "span",
  delayPerWord = 0.07,
  delayInitial = 0,
}: TextRevealProps) {
  const words = text.split(/\s+/);
  const Tag = as as ElementType;
  return (
    <Tag className={cn("inline-block leading-tight", className)}>
      {words.map((w, i) => (
        <motion.span
          key={i + w}
          className="inline-block will-change-transform"
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: delayInitial + i * delayPerWord, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </Tag>
  );
}
