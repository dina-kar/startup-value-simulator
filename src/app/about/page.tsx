import { AboutSection } from "@/components/mvpblocks/AboutSection";
import { TestimonialMarquee } from "@/components/mvpblocks/TestimonialMarquee";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24">
        <AboutSection heading="Built for founders first" tagline="A focused modeling engine intentionally scoped to pre-Series B realities." />
        <TestimonialMarquee />
      </div>
    </div>
  )
}
