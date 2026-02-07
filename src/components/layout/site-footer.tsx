import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-secondary/70 bg-secondary text-secondary-foreground">
      <div className="container-wide py-12 md:py-16">
        <div className="grid gap-8 text-center md:grid-cols-[1.2fr_0.8fr_0.8fr_1.2fr] md:text-left">
          <div className="flex flex-col items-center space-y-4 md:items-start">
            <Image src={BRAND_ASSETS.logo} alt="RetroMuscle" width={150} height={68} className="h-14 w-auto object-contain" />
            <p className="max-w-sm text-sm text-white/80">
              Le programme affilie RetroMuscle pour aider les createurs a obtenir un revenu plus regulier.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-[0.14em] text-white/90">Plateforme</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><Link href="/apply" className="hover:text-white">S&apos;inscrire</Link></li>
              <li><Link href="/login" className="hover:text-white">Connexion</Link></li>
              <li><Link href="/creators" className="hover:text-white">Programme createur</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Espace createur</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-[0.14em] text-white/90">Ressources</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><Link href="/" className="hover:text-white">Comment ca marche</Link></li>
              <li><Link href="/creators" className="hover:text-white">Packs & revenus</Link></li>
              <li><Link href="/join" className="hover:text-white">Guide d&apos;inscription</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Confidentialite</Link></li>
              <li><Link href="/terms" className="hover:text-white">Conditions</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-[0.14em] text-white/90">Newsletter createurs</h4>
            <p className="text-sm text-white/75">
              Recois les prochaines opportunites et les nouvelles du programme affilie.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="email@exemple.com"
                className="h-11 w-full rounded-xl border border-white/40 bg-white/10 px-4 text-sm text-white placeholder:text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <Button className="w-full">S&apos;abonner</Button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/20 pt-6 text-sm text-white/70">
          <p>&copy; {new Date().getFullYear()} RetroMuscle. Ecommerce + Programme affilie.</p>
        </div>
      </div>
    </footer>
  );
}
