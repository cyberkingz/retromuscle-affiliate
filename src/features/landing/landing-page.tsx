import { SectionHeading } from "@/components/ui/section-heading";
import type { LandingPageData } from "@/application/use-cases/get-landing-page-data";
import { FaqList } from "@/features/landing/components/faq-list";
import { GoalsStrip } from "@/features/landing/components/goals-strip";
import { HeroSection } from "@/features/landing/components/hero-section";
import { MixesGrid } from "@/features/landing/components/mixes-grid";
import { PackagesGrid } from "@/features/landing/components/packages-grid";
import { RatesTable } from "@/features/landing/components/rates-table";
import { TestimonialsGrid } from "@/features/landing/components/testimonials-grid";

interface LandingPageProps {
  data: LandingPageData;
}

export function LandingPage({ data }: LandingPageProps) {
  return (
    <div className="space-y-10 sm:space-y-12">
      <HeroSection {...data.hero} />

      <GoalsStrip items={data.goals} />

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Revenus"
          title="Packages, gains et styles de contenu"
          subtitle="Choisis ton rythme de missions et le style qui te ressemble pour construire un revenu regulier."
        />
        <PackagesGrid packages={data.packages} />
        <RatesTable rates={data.videoRates} />
        <MixesGrid mixes={data.mixes} />
      </section>

      <TestimonialsGrid items={data.testimonials} />
      <FaqList items={data.faq} />
    </div>
  );
}
