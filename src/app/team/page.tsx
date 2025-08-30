import { TeamSection } from "@/components/mvpblocks/TeamSection";
import { TestimonialMarquee } from "@/components/mvpblocks/TestimonialMarquee";

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <TeamSection />
      <TestimonialMarquee />
    </div>
  )
}
