import type { VideoAsset } from "@/domain/types";

export const RECOMMENDED_MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const VIDEO_METADATA_TIMEOUT_MS = 8_000;
export const PREFERRED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/mov"]);
export const PREFERRED_VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);

export function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "video.mp4";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96);
}

export async function readVideoMetadata(
  file: File
): Promise<{ durationSeconds: number; width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error("Impossible de lire les métadonnées (timeout)."));
      }, VIDEO_METADATA_TIMEOUT_MS);

      function cleanup() {
        window.clearTimeout(timeoutId);
        video.onloadedmetadata = null;
        video.onerror = null;
      }

      video.onloadedmetadata = () => {
        cleanup();
        resolve();
      };
      video.onerror = () => {
        cleanup();
        reject(new Error("Impossible de lire la vidéo."));
      };
    });

    return {
      durationSeconds: Math.max(1, Math.round(video.duration)),
      width: video.videoWidth,
      height: video.videoHeight
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getFileExtension(filename: string): string {
  const value = filename.trim().toLowerCase();
  if (!value.includes(".")) return "";
  return value.split(".").pop() ?? "";
}

export function isPreferredVideoFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase();
  const extension = getFileExtension(file.name);
  if (PREFERRED_VIDEO_MIME_TYPES.has(mime)) return true;
  if (!mime && PREFERRED_VIDEO_EXTENSIONS.has(extension)) return true;
  return PREFERRED_VIDEO_EXTENSIONS.has(extension);
}

export function resolveAllowedResolution(
  width: number,
  height: number
): VideoAsset["resolution"] | null {
  const value = `${width}x${height}`;
  if (value === "1080x1920" || value === "1080x1080") return value;
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload a file to a Supabase Storage signed PUT URL with progress reporting.
 * Reused by single-video and batch upload flows.
 */
export function uploadFileToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", file);

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("Upload impossible. Réessaie dans quelques instants."));
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Upload impossible. Réessaie dans quelques instants."))
    );
    xhr.send(form);
  });
}
