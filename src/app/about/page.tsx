import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/app/_lib/metadata";

export const revalidate = 86400;

export const metadata = createPageMetadata({
  title: "Qui est RetroMuscle ?",
  description:
    "Créé en 2023 à Limoges, RetroMuscle est un hommage vibrant à l'âge d'or du bodybuilding. Découvre notre histoire, nos valeurs et pourquoi on a créé un programme créateur.",
  path: "/about"
});

const GUARANTEES = [
  { label: "Qualité premium", icon: "✦" },
  { label: "Matériaux durables", icon: "◈" },
  { label: "Livraison sécurisée", icon: "◎" },
  { label: "Support 5 étoiles", icon: "★" },
  { label: "Retours faciles", icon: "↺" },
  { label: "Transparence", icon: "◇" }
];

export default function AboutPage() {
  return (
    <PageShell currentPath="/about">
      <div className="space-y-0">
        {/* ── Hero ── */}
        <div className="relative h-[380px] w-full overflow-hidden rounded-2xl sm:h-[520px]">
          <Image
            src="https://retromuscle.net/cdn/shop/files/firebird_comp_3.jpg"
            alt="Deux athlètes année 80 avec des joggings vintages devant une Pontiac Firebird"
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 via-secondary/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
              Limoges, 2023
            </p>
            <h1 className="mt-2 font-display text-4xl uppercase leading-none text-white sm:text-6xl">
              Qui sommes-nous&nbsp;?
            </h1>
          </div>
        </div>

        {/* ── Brand story ── */}
        <section className="mx-auto max-w-2xl px-4 py-14 text-center sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/50">
            L&apos;histoire de la marque
          </p>
          <h2 className="mt-3 font-display text-2xl uppercase sm:text-3xl">
            Plus qu&apos;une marque de vêtements
          </h2>
          <p className="mt-6 text-base leading-relaxed text-foreground/75">
            Créé en janvier&nbsp;2023 à Limoges, RetroMuscle c&apos;est un hommage vibrant à
            l&apos;âge d&apos;or du bodybuilding — une époque où style, détermination et
            excellence allaient de pair.
          </p>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            Inspirés par les années&nbsp;80, nous créons des pièces uniques &amp;
            originales, pensées pour les passionnés qui refusent le banal. Chaque
            détail, chaque couture reflète cette philosophie old-school : des coupes
            audacieuses, des matériaux robustes, et un style qui impose.
          </p>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            Que ce soit dans la salle ou dans la vie de tous les jours, RetroMuscle
            est là pour t&apos;accompagner et te rappeler qu&apos;une véritable légende se
            construit avec le cœur, l&apos;effort et une touche de nostalgie.
          </p>
        </section>

        {/* ── Guarantees ── */}
        <section className="bg-secondary px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/50">
              Nos engagements
            </p>
            <h2 className="mt-2 text-center font-display text-2xl uppercase text-white sm:text-3xl">
              Les garanties RetroMuscle
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 sm:grid-cols-3 lg:grid-cols-6">
              {GUARANTEES.map((g) => (
                <div
                  key={g.label}
                  className="flex flex-col items-center gap-3 bg-white/5 px-4 py-6 text-center hover:bg-white/10 transition-colors"
                >
                  <span className="text-2xl text-primary">{g.icon}</span>
                  <span className="text-[11px] uppercase tracking-[0.12em] leading-snug text-white/80">
                    {g.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Creator commitments ── */}
        <section className="px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
                Programme créateurs
              </span>
              <h2 className="mt-3 font-display text-2xl uppercase sm:text-3xl">
                Ce qu&apos;on promet à nos créateurs
              </h2>
              <p className="mt-3 text-sm text-foreground/60 max-w-xl mx-auto">
                Rejoindre RetroMuscle, c&apos;est s&apos;engager avec une marque qui prend soin de ceux qui la représentent.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "💸",
                  title: "Paiement mensuel garanti",
                  desc: "Chaque vidéo validée déclenche un paiement. Virement mensuel sur IBAN ou PayPal, sans relance de ta part."
                },
                {
                  icon: "📋",
                  title: "Tarifs affichés, sans surprise",
                  desc: "Tu sais exactement combien tu touches avant de filmer. Pas de négociation, pas de flou — le tarif est public."
                },
                {
                  icon: "⚡",
                  title: "Validation sous 48h",
                  desc: "Chaque upload est reviewé en moins de 48h. Pas d'attente interminable, pas de silence radio."
                },
                {
                  icon: "💬",
                  title: "Feedback clair sur chaque vidéo",
                  desc: "Si une vidéo est rejetée, tu reçois un retour précis pour comprendre et corriger. On ne te laisse pas dans le flou."
                },
                {
                  icon: "🎯",
                  title: "Zéro quota, zéro pression",
                  desc: "Tu produis à ton rythme. Pas de minimum mensuel, pas de deadline, pas d'engagement long terme."
                },
                {
                  icon: "🤝",
                  title: "Une relation sur le long terme",
                  desc: "On veut des créateurs qui durent. Pas un deal one-shot — un programme pensé pour évoluer avec toi."
                }
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-line bg-white p-6 hover:border-primary/30 hover:shadow-sm transition-all">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="mt-3 font-display text-base uppercase">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Materials + Traceability ── */}
        <section className="px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-line">
            <div className="grid sm:grid-cols-2">
              <div className="border-b border-line p-8 sm:border-b-0 sm:border-r sm:p-10">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">
                  Matières
                </span>
                <h2 className="mt-4 font-display text-2xl uppercase">
                  Nos matériaux
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                  Nos matériaux sont rigoureusement sélectionnés pour offrir une
                  sensation incomparable et une qualité exceptionnelle. Chaque tissu
                  est choisi avec soin pour allier confort, épaisseur, durabilité et
                  style, afin de te garantir une expérience unique à chaque porté.
                </p>
              </div>
              <div className="p-8 sm:p-10">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-primary">
                  Production
                </span>
                <h2 className="mt-4 font-display text-2xl uppercase">
                  Traçabilité
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                  Nos produits sont fabriqués en Asie. Nous les sélectionnons pour
                  leur expertise et leur savoir-faire selon un cahier des charges
                  strict. Chaque pièce est réalisée avec une attention minutieuse aux
                  détails, afin de garantir une qualité irréprochable qui respecte
                  nos standards exigeants.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Golden Era closing + affiliate CTA ── */}
        <section className="relative h-[500px] overflow-hidden rounded-2xl sm:h-[580px]">
          <Image
            src="https://retromuscle.net/cdn/shop/files/firebird_comp_2.jpg"
            alt="Athlète RetroMuscle Golden Era"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Dark left-to-right gradient so text pops on left side */}
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/60 to-secondary/10" />
          {/* Bottom fade for continuity */}
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-transparent to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 lg:px-16">
            <div className="max-w-lg">
              <span className="inline-block rounded-full border border-primary/50 bg-primary/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
                Golden Era
              </span>
              <h2 className="mt-4 font-display text-4xl uppercase leading-none text-white sm:text-5xl lg:text-6xl">
                Vis<br />l&apos;aventure
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-white/75 sm:text-base">
                RetroMuscle, c&apos;est plus qu&apos;une simple marque, c&apos;est une vision.
                Une ode aux passionnés qui refusent de passer inaperçus.
                Rejoins le mouvement et porte haut les valeurs de l&apos;âge d&apos;or.
              </p>
              <div className="mt-7">
                <Button asChild size="pill" className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30">
                  <Link href="/apply">S&apos;inscrire au programme créateurs</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
