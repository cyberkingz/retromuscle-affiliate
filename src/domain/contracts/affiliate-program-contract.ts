export const AFFILIATE_CONTRACT_VERSION = "2026-02-06-v2";

export interface ContractSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const AFFILIATE_CONTRACT_TITLE = "Contrat de collaboration - Programme Affilie RetroMuscle";

export const AFFILIATE_CONTRACT_SECTIONS: ContractSection[] = [
  {
    id: "parties",
    title: "1. Parties et objet",
    paragraphs: [
      "Ce contrat (le \"Contrat\") encadre la collaboration entre RetroMuscle (la \"Marque\") et toi (le \"Createur\").",
      "L'objet est de produire et livrer des contenus video et/ou photo (les \"Contenus\") pour les besoins marketing de la Marque, selon des briefs, des quotas et un cycle mensuel (le \"Cycle\").",
      "La collaboration est non exclusive: tu restes libre de collaborer avec d'autres marques, sous reserve de respecter les obligations de confidentialite, de conformite publicitaire, et les droits accordes a la Marque dans le present Contrat.",
      "Le Createur agit en tant que prestataire independant. Rien dans le Contrat ne cree une relation de salariat, d'agence, de partenariat ou de representation."
    ]
  },
  {
    id: "definitions",
    title: "2. Definitions",
    paragraphs: [
      "\"Brief\" designe les consignes communiquees par la Marque (formats, angles, scripts, contraintes, dates, elements de marque, claims interdits, etc.), notamment via le dashboard.",
      "\"Contenu\" designe toute creation (video, photo, audio, texte associe, hooks, sous-titres, variantes, thumbnails, exports) livree par le Createur dans le cadre du Programme.",
      "\"Livrables\" designe les fichiers effectivement remis via la plateforme (uploads) et/ou tout support convenu par ecrit.",
      "\"Valide\" designe un Livrable accepte par la Marque a l'issue du processus de review."
    ]
  },
  {
    id: "process",
    title: "3. Process, livrables et qualite",
    paragraphs: [
      "Tu produis les Livrables conformement au Brief et aux specs (formats, duree, ratio, resolution, audio, sous-titres, etc.).",
      "Tu t'engages a livrer des fichiers exploitables (techniquement et creativement) et a respecter les regles de qualite: hook rapide, lisibilite, son propre, stabilite, et coherence avec l'univers RetroMuscle.",
      "La Marque peut demander des ajustements raisonnables (revisions) pour obtenir un rendu conforme au Brief. Les demandes de revisions doivent rester coherentes avec le Brief initial.",
      "Tu garantis que les Contenus sont sinceres, authentiques, et que les performances ou resultats suggeres ne sont pas trompeurs."
    ],
    bullets: [
      "Tu utilises uniquement des musiques/sons/visuels pour lesquels tu disposes des droits necessaires (ou des bibliotheques autorisees).",
      "Tu respectes les consignes de securite, de marque et de compliance (voir section 8).",
      "Tu ne fournis pas de contenu illicite, haineux, violent, discriminant, sexuel explicite, ni trompeur."
    ]
  },
  {
    id: "submission",
    title: "4. Livraison, validation et rejets",
    paragraphs: [
      "Tu livres les fichiers via la plateforme RetroMuscle. La Marque review les Livrables et les marque \"Valide\" ou \"Rejete\" avec une raison.",
      "Un Livrable peut etre rejete s'il ne respecte pas le Brief, les specs techniques, ou les exigences de qualite.",
      "En cas de rejet, tu peux re-uploader une version corrigee. La Marque n'est pas tenue de valider un Livrable non conforme.",
      "Les Livrables \"Valides\" peuvent ensuite etre recoupes, re-montes, sous-titres, ou adaptes pour la diffusion et la publicite."
    ]
  },
  {
    id: "payment",
    title: "5. Remuneration, paiement et taxes",
    paragraphs: [
      "La remuneration est calculee selon les rates/forfaits communiques dans la plateforme (par type de contenu, volume, et/ou regles du Cycle).",
      "Principe general: seuls les Livrables \"Valides\" declenchent la remuneration correspondante.",
      "Les paiements sont prepares et effectues mensuellement, apres la fin du Cycle et la validation des Livrables. Des delais bancaires peuvent s'appliquer.",
      "Tu es responsable de tes obligations fiscales et sociales (statut, declarations, TVA le cas echeant).",
      "En cas de contestation d'un montant, le Createur doit signaler le sujet dans un delai raisonnable (30 jours) apres publication du recapitulatif du Cycle."
    ]
  },
  {
    id: "license",
    title: "6. Cession de droits / Licence d'utilisation des Contenus",
    paragraphs: [
      "En contrepartie de la remuneration, tu accordes a la Marque une licence mondiale, non exclusive, cessible, sous-licenciable, irrevocable et gratuite (royalty-free) sur les Contenus Valides, pour toute la duree de protection des droits (ou, si plus long, de maniere perpetuelle lorsque permis).",
      "Cette licence inclut le droit d'utiliser les Contenus a des fins marketing, promotionnelles et publicitaires, en organique et en paid (ads), sur tous supports et canaux (notamment: TikTok, Meta/Instagram/Facebook, YouTube, Snapchat, Pinterest, site web, email, marketplaces, TV/CTV, DOOH, presse, et tout media futur).",
      "La Marque peut donner acces aux Contenus a ses prestataires (agences media, monteurs, studios, consultants) et plateformes publicitaires, uniquement pour l'exploitation des Contenus et la gestion des campagnes."
    ],
    bullets: [
      "Reproduire, copier, stocker, distribuer, diffuser, communiquer au public, afficher publiquement",
      "Adapter, modifier, editer, recadrer, compresser, re-monter, sous-titrer, traduire, extraire des passages, creer des versions/derives (hooks, cutdowns, variations, thumbnails)",
      "Combiner le Contenu avec d'autres elements (graphismes, musique, voix-off, captures produit, offres, CTA) et l'integrer dans des campagnes",
      "Exploiter les Contenus sous forme de publicites (ads) et optimiser (A/B tests, variations creatifs, recadrages, re-encodage)"
    ]
  },
  {
    id: "likeness",
    title: "7. Droit a l'image, voix, nom et attributs",
    paragraphs: [
      "Si ta personne apparait dans les Contenus, tu autorises la Marque a utiliser ton image, ta voix, ton nom/pseudo et ta performance, exclusivement dans le cadre de l'exploitation des Contenus conformement a la section 6.",
      "Tu reconnais que la Marque peut effectuer des modifications raisonnables (montage, titrage, sous-titres, sound design) sans denaturer de maniere malveillante ton propos.",
      "Si des tiers apparaissent (amis, figurants, mineurs), tu confirmes disposer de leur consentement ecrit (et, pour les mineurs, celui des responsables legaux)."
    ]
  },
  {
    id: "compliance",
    title: "8. Conformite (lois, plateformes, publicite)",
    paragraphs: [
      "Tu respectes les lois applicables, les regles des plateformes, et les consignes de la Marque (claims, securite, mentions).",
      "Lorsque tu publies du contenu en ton nom pour la Marque, tu respectes les obligations de transparence publicitaire (ex: #ad, #publicite, partenariat remunere) selon les regles locales et celles des plateformes.",
      "Tu n'utilises pas de musique, logos, marques, images, ou contenus tiers sans droits/autorisation."
    ],
    bullets: [
      "Pas de claims medicaux ou promesses de resultats non verifies",
      "Pas de propos diffamatoires ou trompeurs sur des tiers",
      "Respect des regles de protection des donnees: ne pas afficher des informations personnelles de clients/tiers"
    ]
  },
  {
    id: "brand-safety",
    title: "9. Brand safety (clauses de protection Marque)",
    paragraphs: [
      "Le Createur s'engage a ne pas publier, dans le cadre de la collaboration, de contenu susceptible de nuire a l'image de RetroMuscle (contenu haineux, illegal, trompeur, ou contraire aux valeurs de la Marque).",
      "Le Createur s'interdit d'utiliser des visuels, musiques ou assets susceptibles de declencher des reclamations (copyright/DMCA) dans les campagnes de la Marque.",
      "En cas d'incident (claim, plainte, contenu litigieux), la Marque peut suspendre l'exploitation et demander des modifications ou un retrait."
    ]
  },
  {
    id: "warranties",
    title: "10. Garanties, responsabilites et indemnite",
    paragraphs: [
      "Tu garantis que tu es titulaire de tous les droits necessaires sur les Contenus fournis (ou que tu disposes des autorisations requises), et que l'exploitation par la Marque ne violera pas les droits de tiers.",
      "Tu garantis l'absence de logiciels malveillants dans les fichiers livres.",
      "Tu indemniseras la Marque en cas de reclamation d'un tiers liee a un manquement de ta part (ex: violation de droits, absence de consentement, contenu illicite).",
      "La responsabilite totale de la Marque, toutes causes confondues, est limitee (dans la mesure permise) aux sommes effectivement payees au Createur au cours des 3 derniers mois precedant l'evenement."
    ]
  },
  {
    id: "confidentiality",
    title: "11. Confidentialite et communications",
    paragraphs: [
      "Tu t'engages a garder confidentiels les briefs, informations internes, prix, process, donnees de performance, et tout element non public communique par la Marque.",
      "Cette obligation s'applique pendant la duree du Contrat et pendant 2 ans apres sa fin.",
      "Tu peux mentionner une collaboration de maniere generale, sans divulguer d'informations confidentielles.",
      "Sauf accord ecrit, tu n'utilises pas les marques, logos, ou assets de RetroMuscle en dehors du cadre des Livrables."
    ]
  },
  {
    id: "independent",
    title: "12. Independants / absence d'exclusivite",
    paragraphs: [
      "Le Createur organise librement son temps, ses moyens et sa methode de travail. La Marque fixe les objectifs (Brief, specs, deadlines) mais ne controle pas la maniere de filmer au quotidien.",
      "La collaboration est non exclusive. Toutefois, pendant un Cycle, le Createur evite les contenus qui creeraient une confusion manifeste (ex: campagne concurrente directe) si cela a ete precise dans un Brief."
    ]
  },
  {
    id: "term",
    title: "13. Duree, resiliation, effets",
    paragraphs: [
      "Le Contrat prend effet a la date de signature et reste en vigueur jusqu'a resiliation.",
      "Chaque partie peut resilier a tout moment avec un preavis raisonnable, sauf faute grave (resiliation immediate possible).",
      "Les droits d'exploitation sur les Contenus Valides livres avant la resiliation survivent a la fin du Contrat (section 6).",
      "En cas de resiliation pour manquement grave (contenu illicite, fraude, violation droits tiers), la Marque peut suspendre l'acces a la plateforme et a la remuneration des Livrables non valides."
    ]
  },
  {
    id: "misc",
    title: "14. Divers",
    paragraphs: [
      "Modification: la Marque peut mettre a jour les Briefs et regles du Programme. Toute evolution materielle du Contrat donnera lieu a une nouvelle version a accepter.",
      "Cession: la Marque peut ceder le Contrat et/ou sous-licencier les droits a ses partenaires (agences media, prestataires, filiales, distributeurs) pour les besoins d'exploitation.",
      "Droit applicable et juridiction: droit francais. En cas de litige, les tribunaux competents de Paris seront seuls competents, sauf disposition d'ordre public contraire.",
      "Si une clause est invalide, les autres restent applicables."
    ]
  }
];

export function getAffiliateContractCanonicalText(): string {
  const lines: string[] = [];
  lines.push(AFFILIATE_CONTRACT_TITLE);
  lines.push(`Version: ${AFFILIATE_CONTRACT_VERSION}`);
  lines.push("");

  for (const section of AFFILIATE_CONTRACT_SECTIONS) {
    lines.push(section.title);
    lines.push("");
    for (const paragraph of section.paragraphs) {
      lines.push(paragraph);
      lines.push("");
    }
    if (section.bullets?.length) {
      for (const bullet of section.bullets) {
        lines.push(`- ${bullet}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n").trim() + "\n";
}
