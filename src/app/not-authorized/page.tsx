import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { CardSection } from "@/components/layout/card-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { getRedirectTargetFromCookies } from "@/features/auth/server/route-guards";

interface NotAuthorizedPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function normalizeNext(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  return trimmed.slice(0, 256);
}

export default async function NotAuthorizedPage({ searchParams }: NotAuthorizedPageProps) {
  const target = await getRedirectTargetFromCookies();
  const params = searchParams ? await searchParams : undefined;
  const next = normalizeNext(params?.next);

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-[720px] pt-10 sm:pt-12">
        <CardSection padding="lg">
          <SectionHeading
            eyebrow="403"
            title="Acces refuse"
            subtitle="Ton compte n'a pas l'autorisation d'acceder a cette page."
          />

          <div className="mt-6 flex flex-wrap gap-2">
            {target ? (
              <Button asChild size="pill">
                <Link href={target}>Aller a mon espace</Link>
              </Button>
            ) : (
              <Button asChild size="pill">
                <Link href="/login">Aller a la connexion</Link>
              </Button>
            )}

            <Button asChild size="pill" variant="outline">
              <Link href={{ pathname: next ?? "/" }}>Retour</Link>
            </Button>
          </div>
        </CardSection>
      </section>
    </PageShell>
  );
}
