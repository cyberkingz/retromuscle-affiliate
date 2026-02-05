import type { SaasLandingData } from "@/application/use-cases/get-saas-landing-data";
import { LandingHero } from "@/features/saas-landing/components/landing-hero";
import { TrustStrip } from "@/features/saas-landing/components/trust-strip";
import { PainValueGrid } from "@/features/saas-landing/components/pain-value-grid";
import { FlowSection } from "@/features/saas-landing/components/flow-section";
import { PricingStrip } from "@/features/saas-landing/components/pricing-strip";
import { FaqGrid } from "@/features/saas-landing/components/faq-grid";
import { SocialProofWall } from "@/features/saas-landing/components/social-proof-wall";
import { ActionBand } from "@/features/saas-landing/components/action-band";

interface SaasLandingPageProps {
  data: SaasLandingData;
}

export function SaasLandingPage({ data }: SaasLandingPageProps) {
  return (
    <div className="space-y-24 pb-24 sm:space-y-32">
      <LandingHero {...data.hero} />
      <TrustStrip points={data.trustPoints} />
      <PainValueGrid items={data.painToValue} />
      <FlowSection items={data.flow} />
      <SocialProofWall
        testimonials={data.socialProof.testimonials}
        trustedBy={data.socialProof.trustedBy}
      />
      <PricingStrip plans={data.pricing} />
      <FaqGrid items={data.faqs} />
      <ActionBand title={data.action.title} subtitle={data.action.subtitle} cta={data.action.cta} />
    </div>
  );
}