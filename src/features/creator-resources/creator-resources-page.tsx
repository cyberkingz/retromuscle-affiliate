import { SectionHeading } from "@/components/ui/section-heading";
import { ResourceContentSection } from "@/features/creator-resources/components/resource-content-section";
import type { PublicResource, ResourceContentType } from "@/domain/types";
import { RESOURCE_CONTENT_TYPES } from "@/domain/types";

interface CreatorResourcesPageProps {
  resources: PublicResource[];
}

export function CreatorResourcesPage({ resources }: CreatorResourcesPageProps) {
  const byType = RESOURCE_CONTENT_TYPES.reduce<Record<ResourceContentType, PublicResource[]>>(
    (acc, type) => {
      acc[type] = resources.filter((r) => r.contentType === type);
      return acc;
    },
    {} as Record<ResourceContentType, PublicResource[]>
  );

  const hasAny = resources.length > 0;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Créateur"
        title="Ressources"
        subtitle="Guides et conseils pour créer du contenu de qualité."
      />

      {!hasAny && (
        <p className="text-sm text-foreground/60">
          Aucune ressource disponible pour le moment. Reviens bientôt !
        </p>
      )}

      <div className="space-y-10">
        {RESOURCE_CONTENT_TYPES.map((type) =>
          byType[type].length > 0 ? (
            <ResourceContentSection key={type} contentType={type} resources={byType[type]} />
          ) : null
        )}
      </div>
    </div>
  );
}
