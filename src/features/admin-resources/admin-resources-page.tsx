"use client";

import { AddResourceButton } from "@/features/admin-resources/components/add-resource-dialog";
import { ResourcesTable } from "@/features/admin-resources/components/resources-table";
import type { PublicResource } from "@/domain/types";

interface AdminResourcesPageProps {
  resources: PublicResource[];
}

export function AdminResourcesPage({ resources }: AdminResourcesPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ressources</h1>
          <p className="text-sm text-foreground/60">
            Guides et ressources visibles par les créateurs actifs.
          </p>
        </div>
        <AddResourceButton />
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-sm text-foreground/55">Aucune ressource pour l&apos;instant.</p>
          <p className="mt-1 text-xs text-foreground/40">
            Clique sur «&nbsp;Ajouter&nbsp;» pour uploader un premier guide PDF.
          </p>
        </div>
      ) : (
        <ResourcesTable resources={resources} />
      )}
    </div>
  );
}
