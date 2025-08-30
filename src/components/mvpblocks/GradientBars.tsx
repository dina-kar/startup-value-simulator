"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/**
 * GradientBars renders a subtle animated multi-bar gradient background.
 * Place it as the first child of a relative container (e.g. page root / hero).
 */
export function GradientBars({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ids = ["a","b","c","d","e","f","g","h","i"];
  return (
    <div
      aria-hidden
      {...props}
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden [mask-image:radial-gradient(circle_at_center,white,transparent_75%)]",
        className,
      )}
    >
      <div className="absolute inset-0 flex gap-6 opacity-40 dark:opacity-30">
    {ids.map((id, i) => (
          <span
      key={id}
            className={cn(
              "relative flex-1 rounded-3xl bg-gradient-to-b from-blue-500/0 via-purple-500/30 to-purple-600/0",
              "before:absolute before:inset-0 before:rounded-3xl before:bg-[radial-gradient(circle_at_50%_0%,theme(colors.blue.400/_0.35),transparent_70%)]",
              "animate-gradient-float",
            )}
            style={{
              animationDelay: `${i * 0.35}s`,
              animationDuration: `${18 + (i % 3) * 4}s`,
            }}
          />
        ))}
      </div>
      {/* soft top & bottom fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
