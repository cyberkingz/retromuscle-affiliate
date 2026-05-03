"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RESOURCE_CONTENT_TYPE_LABELS } from "@/domain/constants/labels";
import { useResourceMutation } from "@/features/admin-resources/hooks/use-resource-mutation";
import type { PublicResource } from "@/domain/types";

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface ResourcesTableProps {
  resources: PublicResource[];
}

function PublishToggleButton({ resource }: { resource: PublicResource }) {
  const { isPending, mutate } = useResourceMutation<{ isPublished: boolean }>(
    `/api/resources/${resource.id}`,
    "PATCH"
  );

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 px-2 text-xs"
      disabled={isPending || !resource.fileName}
      title={resource.fileName ? undefined : "Aucun fichier attaché"}
      onClick={() => void mutate({ isPublished: !resource.isPublished })}
    >
      {resource.isPublished ? (
        <><EyeOff className="mr-1 h-3 w-3" /> Dépublier</>
      ) : (
        <><Eye className="mr-1 h-3 w-3" /> Publier</>
      )}
    </Button>
  );
}

function DeleteButton({ resource }: { resource: PublicResource }) {
  const [open, setOpen] = useState(false);
  const { isPending, error, mutate } = useResourceMutation(`/api/resources/${resource.id}`, "DELETE");

  async function handleConfirm() {
    const ok = await mutate();
    if (ok) setOpen(false);
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce guide ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/70">
            <span className="font-medium">{resource.title}</span> sera définitivement supprimé.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => void handleConfirm()}
            >
              {isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ResourcesTable({ resources }: ResourcesTableProps) {
  const columns: ColumnDef<PublicResource>[] = [
    {
      accessorKey: "title",
      header: "Titre",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.title}</p>
          {row.original.description && (
            <p className="text-xs text-foreground/55 line-clamp-1">{row.original.description}</p>
          )}
        </div>
      )
    },
    {
      accessorKey: "contentType",
      header: "Catégorie",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {RESOURCE_CONTENT_TYPE_LABELS[row.original.contentType]}
        </Badge>
      )
    },
    {
      accessorKey: "fileSizeBytes",
      header: "Taille",
      cell: ({ row }) => (
        <span className="text-xs text-foreground/60">{formatFileSize(row.original.fileSizeBytes)}</span>
      )
    },
    {
      accessorKey: "isPublished",
      header: "Statut",
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? "default" : "outline"} className="text-[10px]">
          {row.original.isPublished ? "Publié" : "Brouillon"}
        </Badge>
      )
    },
    {
      accessorKey: "sortOrder",
      header: "Ordre",
      cell: ({ row }) => (
        <span className="text-xs text-foreground/60">{row.original.sortOrder}</span>
      )
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <PublishToggleButton resource={row.original} />
          <DeleteButton resource={row.original} />
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={resources}
      renderMobileRow={(row) => (
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.title}</p>
            <p className="text-xs text-foreground/55">
              {RESOURCE_CONTENT_TYPE_LABELS[row.contentType]} · {formatFileSize(row.fileSizeBytes)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <PublishToggleButton resource={row} />
            <DeleteButton resource={row} />
          </div>
        </div>
      )}
    />
  );
}
