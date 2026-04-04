import type { SaasLandingData } from "@/application/use-cases/get-saas-landing-data";
import { LandingHero } from "@/features/saas-landing/components/landing-hero";
import { FlowSection } from "@/features/saas-landing/components/flow-section";
import { ImageTextSection } from "@/features/saas-landing/components/image-text-section";
import { EarningsSection } from "@/features/saas-landing/components/earnings-section";
import { RatesSection } from "@/features/saas-landing/components/rates-section";
import { QualifierSection } from "@/features/saas-landing/components/qualifier-section";
import { FaqGrid } from "@/features/saas-landing/components/faq-grid";
import { ActionBand } from "@/features/saas-landing/components/action-band";

interface SaasLandingPageProps {
  data: SaasLandingData;
}

export function SaasLandingPage({ data }: SaasLandingPageProps) {
  return (
    <div className="space-y-24 pb-24 sm:space-y-32">
      <LandingHero {...data.hero} />
      <FlowSection flow={data.flow} />
      <RatesSection {...data.rates} />

      {data.imageTextBlocks.map((block) => (
        <ImageTextSection key={block.tag} block={block} />
      ))}

      <EarningsSection {...data.earnings} />
      <QualifierSection qualifier={data.qualifier} />
      <FaqGrid items={data.faqs} />
      <ActionBand title={data.action.title} subtitle={data.action.subtitle} cta={data.action.cta} />
    </div>
  );
}
