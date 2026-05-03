"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RESOURCE_CONTENT_TYPES } from "@/domain/types";
import { RESOURCE_CONTENT_TYPE_LABELS } from "@/domain/constants/labels";
import { uploadFileToSignedUrl } from "@/features/creator-uploads/lib/upload-helpers";

const MAX_PDF_BYTES = 50 * 1024 * 1024;

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({ open, onOpenChange }: AddResourceDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState<string>(RESOURCE_CONTENT_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const selected = e.target.files?.[0] ?? null;
    if (!selected) { setFile(null); return; }
    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Seuls les fichiers PDF sont acceptés.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_PDF_BYTES) {
      setFileError("Fichier trop volumineux (max 50 Mo).");
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setContentType(RESOURCE_CONTENT_TYPES[0]);
    setFile(null);
    setFileError(null);
    setSubmitError(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setSubmitError("Sélectionne un fichier PDF."); return; }
    setSubmitError(null);
    setIsPending(true);

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          contentType,
          fileName: file.name,
          fileSizeBytes: file.size
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null) as { message?: string } | null;
        setSubmitError(body?.message ?? `Erreur ${res.status}`);
        return;
      }

      const { uploadUrl } = await res.json() as { uploadUrl: string };
      setUploadProgress(0);
      await uploadFileToSignedUrl(uploadUrl, file, setUploadProgress);

      resetForm();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setIsPending(false);
      setUploadProgress(null);
    }
  }

  const inputClass =
    "flex h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60";

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isPending) { resetForm(); onOpenChange(next); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une ressource</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 pb-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/70" htmlFor="res-title">
              Titre <span className="text-destructive">*</span>
            </label>
            <Input
              id="res-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Comment filmer un training"
              required
              minLength={2}
              maxLength={120}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/70" htmlFor="res-desc">
              Description
            </label>
            <textarea
              id="res-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Courte description du guide (optionnel)"
              rows={2}
              maxLength={500}
              disabled={isPending}
              className="flex w-full resize-none rounded-xl border border-line bg-white px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/70" htmlFor="res-type">
              Catégorie <span className="text-destructive">*</span>
            </label>
            <select
              id="res-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              {RESOURCE_CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RESOURCE_CONTENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/70" htmlFor="res-file">
              Fichier PDF <span className="text-destructive">*</span>
            </label>
            <input
              ref={fileInputRef}
              id="res-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={isPending}
              className="block w-full cursor-pointer rounded-xl border border-dashed border-line bg-frost px-3 py-2.5 text-sm text-foreground/70 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {file && (
              <p className="text-xs text-foreground/55">
                {file.name} — {(file.size / (1024 * 1024)).toFixed(1)} Mo
              </p>
            )}
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          {uploadProgress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-foreground/55">
                <span>Upload en cours…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {submitError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => { resetForm(); onOpenChange(false); }}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={isPending || !file || !title.trim()}>
              {isPending ? (
                uploadProgress !== null ? `Upload ${uploadProgress}%…` : "Création…"
              ) : (
                <><Upload className="mr-1.5 h-3.5 w-3.5" />Ajouter</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddResourceButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <PlusCircle className="mr-1.5 h-4 w-4" />
        Ajouter
      </Button>
      <AddResourceDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
