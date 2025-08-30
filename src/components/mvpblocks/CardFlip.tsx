"use client";
import { cn } from "@/lib/utils";

interface CardFlipProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

export function CardFlip({ title, description, icon, className }: CardFlipProps) {
  return (
    <article className={cn(
      "bg-background flex w-full max-w-sm flex-col items-start justify-between border-4 border-black p-6 shadow-[8px_8px_0_0_#000] transition-shadow duration-300 hover:shadow-[12px_12px_0_0_#000] dark:border-white dark:shadow-[8px_8px_0_0_#fff] dark:hover:shadow-[12px_12px_0_0_#fff]",
      className
    )}>
      <div className="mb-2 flex items-center gap-x-2 text-xs">
        <div className="text-foreground border-2 border-black bg-primary px-3 py-1 font-bold dark:border-white">
          Feature
        </div>
      </div>
      <div className="group relative">
        <div className="mb-4 text-3xl">
          {icon}
        </div>
        <h3 className="group-hover:text-primary text-foreground mt-3 text-2xl leading-6 font-black uppercase">
          {title}
        </h3>
        <p className="text-md mt-5 border-l-4 border-primary pl-4 leading-6 text-gray-800 dark:text-gray-100">
          {description}
        </p>
      </div>
    </article>
  );
}

