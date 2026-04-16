import { SectionHeading } from "@/components/ui/section-heading";
import type { LandingPageData } from "@/application/use-cases/get-landing-page-data";
import { FaqList } from "@/features/landing/components/faq-list";
import { GoalsStrip } from "@/features/landing/components/goals-strip";
import { HeroSection } from "@/features/landing/components/hero-section";
import { RatesTable } from "@/features/landing/components/rates-table";
import { TestimonialsGrid } from "@/features/landing/components/testimonials-grid";

interface LandingPageProps {
  data: LandingPageData;
}

export function LandingPage({ data }: LandingPageProps) {
  return (
    <div className="space-y-10 sm:space-y-12">
      <HeroSection {...data.hero} videoRates={data.videoRates} />

      <GoalsStrip items={data.goals} />

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Ce que chaque vid&eacute;o te rapporte"
          title="Un tarif fixe. Pas de surprise."
          subtitle="Chaque vid&eacute;o que tu uploades est &eacute;valu&eacute;e par notre &eacute;quipe sous 48&nbsp;h. Si elle est valid&eacute;e, le paiement tombe au tarif fixe du type que tu as choisi."
        />
        <RatesTable rates={data.videoRates} />
      </section>

      <TestimonialsGrid items={data.testimonials} />
      <FaqList items={data.faq} />
    </div>
  );
}
