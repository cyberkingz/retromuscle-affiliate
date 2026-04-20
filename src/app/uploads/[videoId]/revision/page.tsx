import { redirect } from "next/navigation";
import { getRevisionPageData } from "@/application/use-cases/get-revision-page-data";
import { PageShell } from "@/components/layout/page-shell";
import { getAuthSessionFromCookies, protectPage } from "@/features/auth/server/route-guards";
import { findCreatorIdForUser } from "@/features/auth/server/resolve-auth-session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { RevisionPage } from "@/features/creator-uploads/revision-page";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Corriger la vidéo — RetroMuscle",
  description: "Re-uploade une version corrigée de ta vidéo.",
  path: "/uploads"
});

interface RevisionRouteProps {
  params: Promise<{ videoId: string }>;
}

export default async function RevisionRoute({ params }: RevisionRouteProps) {
  await protectPage("/dashboard");
  const authSession = await getAuthSessionFromCookies();
  const { videoId } = await params;

  const userId = authSession?.userId;
  if (!userId) {
    redirect("/uploads");
  }

  const creatorId =
    (await findCreatorIdForUser({ userId, email: authSession?.email })) ?? undefined;

  if (!creatorId) {
    redirect("/uploads");
  }

  let data: Awaited<ReturnType<typeof getRevisionPageData>>;
  try {
    data = await getRevisionPageData({ userId, videoId });
  } catch {
    // Catches: video not found, wrong owner, wrong status — all redirect cleanly
    redirect("/uploads");
  }

  // Generate a server-side signed URL for the original video preview (3600s TTL).
  let signedVideoUrl: string | null = null;
  try {
    const supabase = createSupabaseServerClient();
    const { data: urlData } = await supabase.storage
      .from("videos")
      .createSignedUrl(data.originalVideo.fileUrl, 3600);
    signedVideoUrl = urlData?.signedUrl ?? null;
  } catch {
    // Non-fatal — the UI renders a fallback thumbnail if null.
  }

  return (
    <PageShell currentPath="/uploads">
      <RevisionPage data={data} signedVideoUrl={signedVideoUrl} />
    </PageShell>
  );
}
