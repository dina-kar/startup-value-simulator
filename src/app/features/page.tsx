import { FeatureGrid } from "@/components/mvpblocks/FeatureGrid";
import { AboutSection } from "@/components/mvpblocks/AboutSection";
import { TestimonialMarquee } from "@/components/mvpblocks/TestimonialMarquee";
import { CTASection } from "@/components/mvpblocks/CTASection";
import { TeamSection } from "@/components/mvpblocks/TeamSection";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <AboutSection heading="Everything you need to model funding" tagline="Cap table engine + SAFE conversions + ESOP pre/post sizing + exit modeling." />
      <FeatureGrid />
      <TeamSection />
      <TestimonialMarquee />
      <CTASection />
    </div>
  )
}
