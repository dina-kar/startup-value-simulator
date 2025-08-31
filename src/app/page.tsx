'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Hero } from "@/components/mvpblocks/Hero";
import { FeatureGrid } from "@/components/mvpblocks/FeatureGrid";
import { CTASection } from "@/components/mvpblocks/CTASection";
import { AboutSection } from "@/components/mvpblocks/AboutSection";
import { TestimonialMarquee } from "@/components/mvpblocks/TestimonialMarquee";
import { GradientBars } from "@/components/mvpblocks/GradientBars";
import { TeamSection } from "@/components/mvpblocks/TeamSection";
import { StatsBar } from "@/components/mvpblocks/StatsBar";
import { useAuth } from '@/lib/auth/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <GradientBars className="fixed inset-0 opacity-25 pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 bg-noise mix-blend-overlay opacity-30" />
      <div className="relative z-10">
        <Hero />
        <StatsBar />
        <FeatureGrid />
        <AboutSection />
        <TestimonialMarquee />
        <TeamSection />
        <CTASection />
      </div>
    </div>
  );
}
