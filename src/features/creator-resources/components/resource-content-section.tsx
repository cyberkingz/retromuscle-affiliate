import { RESOURCE_CONTENT_TYPE_LABELS } from "@/domain/constants/labels";
import { ResourceCard } from "@/features/creator-resources/components/resource-card";
import type { PublicResource, ResourceContentType } from "@/domain/types";

interface ResourceContentSectionProps {
  contentType: ResourceContentType;
  resources: PublicResource[];
}

export function ResourceContentSection({ contentType, resources }: ResourceContentSectionProps) {
  if (resources.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          {RESOURCE_CONTENT_TYPE_LABELS[contentType]}
        </span>
        <div className="h-px flex-1 bg-line" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}
