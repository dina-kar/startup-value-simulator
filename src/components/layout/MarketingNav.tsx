"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";

export function MarketingNav() {
  const { user } = useAuth();
  if (user) return null;
  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Image
            src="/logo.svg"     
            alt="Fund Sim"
            width={50}
            height={50}
            priority
          />
          <span>Fund Sim</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium md:flex">
          <Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link>
            <Link href="/team" className="text-muted-foreground hover:text-foreground">Team</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">Sign In</Link>
            <Link href="/auth/signup" className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90">Get Started</Link>
        </nav>
      </div>
    </header>
  );
}
