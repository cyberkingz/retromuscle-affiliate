# PRD — Plateforme UGC Automatisée RetroMuscle

**Version:** 2.0  
**Date:** 4 Février 2026  
**Auteur:** Aria (basé sur specs Cameron)  
**Statut:** Draft  

---

## 📋 Executive Summary

Création d'une plateforme self-service permettant aux créateurs UGC de s'inscrire, choisir leur package mensuel et mix de vidéos, livrer leurs contenus par catégorie, et être rémunérés automatiquement — avec un dashboard manager pour le suivi complet.

---

## 🎯 Objectifs

| Objectif | Métrique de succès |
|----------|-------------------|
| Réduire le temps de gestion UGC | -80% temps admin |
| Scaler le nombre de créateurs | 50+ créateurs actifs |
| Accélérer les livraisons | <30 jours par cycle mensuel |
| Standardiser la qualité | 90% acceptance rate |

---

## 💰 Modèle Économique

### Packages Mensuels

| Package | Quota vidéos/mois | Crédits mensuels |
|---------|-------------------|------------------|
| **Pack 10** | 10 vidéos | €0 |
| **Pack 20** | 20 vidéos | €25 |
| **Pack 30** | 30 vidéos | €38 |
| **Pack 40** | 40 vidéos | €50 |

> **Note:** Les crédits mensuels sont des bonus accordés aux créateurs en plus de leur rémunération par vidéo.

### Tarifs par Type de Vidéo

| Type de vidéo | Rémunération/vidéo | Description |
|---------------|-------------------|-------------|
| **OOTD** | €100 | Simple (try-on, miroir, face cam) |
| **Training** | €TBD | Montage simple, salle |
| **Before/After** | €TBD | Plus d'effort + storytelling |
| **Sports 80s** | €TBD | DA/lieu/accessoires |
| **Cinematic** | €TBD | DA + montage + color grading |

> ⚠️ **À valider:** Tarifs Training → Cinematic (actuellement €1 = placeholders)

### Mix de Vidéos Prédéfinis

Le créateur choisit un "Mix" qui détermine la répartition automatique de ses quotas par type de vidéo.

| Mix | OOTD | Training | Before/After | Sports 80s | Cinematic | Positionnement |
|-----|------|----------|--------------|------------|-----------|----------------|
| **VOLUME** | 40% | 35% | 20% | 0% | 0% | Max volume perf. Peu de DA |
| **EQUILIBRE** | 30% | 30% | 25% | 10% | 5% | Bon mix perf + image |
| **PREMIUM_80S** | 20% | 25% | 20% | 20% | 15% | DA forte, plus coûteux |
| **TRANSFO_HEAVY** | 20% | 25% | 40% | 10% | 5% | Beaucoup de Before/After |

**Exemple — Pack 20 + Mix VOLUME:**
- OOTD: 8 vidéos (40%)
- Training: 7 vidéos (35%)
- Before/After: 4 vidéos (20%)
- Sports 80s: 0 vidéos
- Cinematic: 1 vidéo (arrondi)

---

## 👥 Personas

### Créateur UGC
- Micro-influenceur fitness (1K-50K followers)
- Cherche revenus complémentaires récurrents
- Veut process simple et paiement mensuel

### Admin RetroMuscle (Manager)
- Gère les campagnes UGC
- Besoin de visibilité sur production mensuelle
- Valide les contenus et déclenche les paiements

---

## 🔄 User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        PARCOURS CRÉATEUR                        │
└─────────────────────────────────────────────────────────────────┘

  Landing Page    →    Inscription    →    Contrat    →    Dashboard
       │                    │                 │              │
       ▼                    ▼                 ▼              ▼
  Découverte du      Formulaire +       Signature        Sélection
  programme          Vérification       électronique     Package + Mix
                     (réseaux sociaux)
                                                              │
                                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CYCLE MENSUEL                              │
└─────────────────────────────────────────────────────────────────┘

  Réception     →    Création    →    Upload par    →    Validation    →    Paiement
  Produits           Vidéos          Catégorie          Admin              Mensuel
                                     (OOTD, Training...)
```

---

## 📱 Fonctionnalités Détaillées

### 1. Landing Page Publique

**URL suggérée:** `retromuscle.net/creators` ou `ugc.retromuscle.net`

**Contenu:**
- Hero section avec vidéos UGC existantes
- Explication du programme (packages, mix, rémunération)
- Témoignages de créateurs actuels
- Grille tarifaire transparente
- FAQ
- CTA "Rejoindre le programme"

---

### 2. Module d'Inscription

**Étape 1 — Informations personnelles:**
```
- Nom créateur (pseudo)
- Email
- WhatsApp
- Pays
- Adresse de livraison (pour produits)
```

**Étape 2 — Profil créateur:**
```
- Liens réseaux sociaux (TikTok, Instagram)
- Nombre de followers
- Portfolio (liens vers contenus existants)
```

**Étape 3 — Sélection initiale:**
```
- Package (10/20/30/40)
- Mix par défaut (VOLUME/EQUILIBRE/PREMIUM_80S/TRANSFO_HEAVY)
```

---

### 3. Contrat Digital

**Déclenchement:** Après validation de la candidature

**Contenu du contrat:**
- Conditions générales du programme
- Droits de propriété intellectuelle (cession complète)
- Modalités de rémunération (mensuelle)
- Quotas et deadlines
- RGPD / données personnelles

**Signature:** Électronique (DocuSign/PandaDoc ou checkbox + date)

---

### 4. Dashboard Créateur

#### 4.1 Vue d'ensemble mensuelle

```
┌─────────────────────────────────────────────────────────────────┐
│  Bonjour [Nom] !                              Février 2026      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📦 Package: 20 vidéos/mois        🎨 Mix: VOLUME              │
│  💰 Crédits mensuels: €25                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PROGRESSION CE MOIS                                     │   │
│  │  ████████████░░░░░░░░ 19/20 vidéos livrées              │   │
│  │                                                          │   │
│  │  💵 Rémunération estimée: €811                          │   │
│  │  ⏳ Reste: 1 vidéo Cinematic                            │   │
│  │  📅 Deadline: 28 Février                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Quotas par Type de Vidéo

```
┌─────────────────────────────────────────────────────────────────┐
│  📹 MES QUOTAS — Février 2026                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OOTD (8 requises)                    ████████ 8/8 ✅          │
│  └ [Vid 1] [Vid 2] [Vid 3] [Vid 4] [Vid 5] [Vid 6] [Vid 7] [8] │
│                                                                 │
│  Training (7 requises)                ███████░ 7/7 ✅          │
│  └ [Vid 1] [Vid 2] [Vid 3] [Vid 4] [Vid 5] [Vid 6] [Vid 7]     │
│                                                                 │
│  Before/After (4 requises)            ████ 4/4 ✅              │
│  └ [Vid 1] [Vid 2] [Vid 3] [Vid 4]                             │
│                                                                 │
│  Sports 80s (0 requises)              — N/A                    │
│                                                                 │
│  Cinematic (1 requise)                ░ 0/1 ⏳                  │
│  └ [+ Ajouter vidéo]                                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  TOTAL: 19/20 livrées | Reste: 1 Cinematic                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3 Interface d'Upload

**Par catégorie de vidéo:**

```
┌─────────────────────────────────────────────────────────────────┐
│  📤 UPLOAD — Cinematic                           0/1 livré     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │     [  Glisser-déposer votre vidéo ici  ]               │   │
│  │                                                          │   │
│  │     ou  [Parcourir les fichiers]                        │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📋 Specs requises:                                            │
│  • Format: MP4, MOV                                            │
│  • Résolution: 1080x1920 (9:16) ou 1080x1080 (1:1)            │
│  • Durée: 15-60 secondes                                       │
│  • Taille max: 500MB                                           │
│                                                                 │
│  💡 Tips pour Cinematic:                                       │
│  • Direction artistique soignée                                │
│  • Color grading travaillé                                     │
│  • Montage dynamique                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.4 Zone Rushes (Optionnel)

```
┌─────────────────────────────────────────────────────────────────┐
│  🎬 MES RUSHES (optionnel)                                      │
├─────────────────────────────────────────────────────────────────┤
│  Les rushes nous permettent de créer des variations.           │
│  Bonus possible si rushes fournis!                             │
│                                                                 │
│  [Zone de drop des fichiers]                                   │
│                                                                 │
│  Rushes uploadés ce mois: 12 fichiers (1.8 GB)                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.5 Historique & Paiements

```
┌─────────────────────────────────────────────────────────────────┐
│  💰 MES PAIEMENTS                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FÉVRIER 2026                                                   │
│  ├─ Statut: EN COURS                                           │
│  ├─ Vidéos livrées: 19/20                                      │
│  ├─ Rémunération estimée: €811                                 │
│  └─ Paiement: À faire (après validation)                       │
│                                                                 │
│  JANVIER 2026                                                   │
│  ├─ Statut: COMPLÉTÉ ✅                                        │
│  ├─ Vidéos livrées: 20/20                                      │
│  ├─ Rémunération: €825                                         │
│  └─ Paiement: Payé le 05/02/26                                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  TOTAL GAGNÉ: €825                                              │
│  EN ATTENTE: €811                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Dashboard Admin (Manager)

#### 5.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│  🏋️ UGC MANAGER — RetroMuscle              Février 2026        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │  CRÉATEURS   │  CRÉATEURS   │  PAIEMENTS   │  TOTAL À     │ │
│  │  OK (mois)   │  EN ATTENTE  │  À FAIRE     │  PAYER (€)   │ │
│  │      12      │      3       │      8       │   €4,250     │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
│                                                                 │
│  📅 Mois ciblé: [Février 2026 ▼]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2 Liste des Créateurs (CREATORS_MASTER)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  👥 CRÉATEURS                                              [+ Ajouter]      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Recherche: [________________]  Filtre: [Statut ▼] [Package ▼] [Mix ▼]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┬─────────────┬────────┬─────────┬───────┬────────┬────────┐ │
│  │ NOM        │ EMAIL       │ PAYS   │ PACKAGE │ QUOTA │ MIX    │ STATUT │ │
│  ├────────────┼─────────────┼────────┼─────────┼───────┼────────┼────────┤ │
│  │ @emma_fit  │ emma@...    │ FR     │ 20      │ 20    │ VOLUME │ 🟢 Actif│ │
│  │ @marc_gym  │ marc@...    │ FR     │ 30      │ 30    │ EQUI.  │ 🟢 Actif│ │
│  │ @julie_fit │ julie@...   │ BE     │ 10      │ 10    │ TRANSFO│ 🟡 Att. │ │
│  └────────────┴─────────────┴────────┴─────────┴───────┴────────┴────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.3 Suivi Mensuel (SUIVI_MENSUEL)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  📊 SUIVI MENSUEL — Février 2026                                                     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────┬─────┬─────┬────────┬────────┬────────┬────────┬────────┬─────┬──────┐ │
│  │ CRÉATEUR │ PKG │ MIX │ Q.OOTD │ Q.TRAIN│ Q.B/A  │ Q.80S  │ Q.CINE │LIVRÉ│RESTE │ │
│  ├──────────┼─────┼─────┼────────┼────────┼────────┼────────┼────────┼─────┼──────┤ │
│  │ emma_fit │ 20  │ VOL │ 8      │ 7      │ 4      │ 0      │ 1      │ 19  │ 1    │ │
│  │          │     │     │ ✅ 8/8 │ ✅ 7/7 │ ✅ 4/4 │ —      │ ⏳ 0/1 │     │      │ │
│  ├──────────┼─────┼─────┼────────┼────────┼────────┼────────┼────────┼─────┼──────┤ │
│  │ marc_gym │ 30  │ EQU │ 9      │ 9      │ 8      │ 3      │ 1      │ 30  │ 0    │ │
│  │          │     │     │ ✅ 9/9 │ ✅ 9/9 │ ✅ 8/8 │ ✅ 3/3 │ ✅ 1/1 │     │      │ │
│  └──────────┴─────┴─────┴────────┴────────┴────────┴────────┴────────┴─────┴──────┘ │
│                                                                                      │
│  Colonnes additionnelles: Deadline, Statut paiement, Total à payer                  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

#### 5.4 File de Validation Vidéos

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ VIDÉOS À VALIDER                            8 en attente    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [PREVIEW]  @emma_fit — Cinematic #1                    │   │
│  │             Type: Cinematic | Uploadé: il y a 2h        │   │
│  │             Durée: 45s | 1080x1920 | MP4                │   │
│  │                                                         │   │
│  │  [▶️ Voir]  [✅ Approuver]  [❌ Rejeter]  [💬 Feedback] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.5 Gestion Paiements

```
┌─────────────────────────────────────────────────────────────────┐
│  💳 PAIEMENTS — Février 2026                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┬──────────┬───────────┬──────────┬────────────┐ │
│  │ CRÉATEUR   │ LIVRÉES  │ MONTANT   │ STATUT   │ ACTION     │ │
│  ├────────────┼──────────┼───────────┼──────────┼────────────┤ │
│  │ emma_fit   │ 19/20    │ €811      │ À faire  │ [Payer]    │ │
│  │ marc_gym   │ 30/30    │ €1,250    │ À faire  │ [Payer]    │ │
│  │ julie_fit  │ 10/10    │ €420      │ Payé ✅  │ —          │ │
│  └────────────┴──────────┴───────────┴──────────┴────────────┘ │
│                                                                 │
│  TOTAL À PAYER CE MOIS: €2,061                                 │
│  [Exporter CSV] [Payer tout]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Technique Recommandée

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Upload:** Uppy ou react-dropzone (chunked uploads)
- **Video player:** Video.js

### Backend
- **API:** Next.js API Routes ou Supabase Edge Functions
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage ou Cloudflare R2
- **Auth:** Supabase Auth (magic link pour créateurs)

### Intégrations
- **Contrat:** DocuSign API ou PandaDoc (ou simple checkbox légale)
- **Paiements:** Stripe Connect (pour payer les créateurs) ou export CSV pour virement manuel
- **Email:** Resend (notifications)
- **Notifications:** Slack webhook (alertes admin)

---

## 📊 Modèle de Données

```sql
-- SETTINGS (configuration globale)
settings (
  id UUID PRIMARY KEY,
  package INT,              -- 10, 20, 30, 40
  quota_videos INT,         -- = package
  credits_mensuels DECIMAL, -- bonus €
  created_at TIMESTAMP
)

-- VIDEO_RATES (tarifs par type)
video_rates (
  id UUID PRIMARY KEY,
  video_type TEXT,          -- OOTD, Training, Before/After, Sports 80s, Cinematic
  rate_per_video DECIMAL,   -- €100, €TBD...
  notes TEXT,
  created_at TIMESTAMP
)

-- MIX_LIBRARY (mix prédéfinis)
mix_library (
  id UUID PRIMARY KEY,
  mix_name TEXT,            -- VOLUME, EQUILIBRE, PREMIUM_80S, TRANSFO_HEAVY
  pct_ootd DECIMAL,
  pct_training DECIMAL,
  pct_before_after DECIMAL,
  pct_sports_80s DECIMAL,
  pct_cinematic DECIMAL,
  notes TEXT,
  created_at TIMESTAMP
)

-- CREATORS_MASTER (base créateurs)
creators (
  id UUID PRIMARY KEY,
  nom TEXT,
  email TEXT UNIQUE,
  whatsapp TEXT,
  pays TEXT,
  address JSONB,
  package INT REFERENCES settings(package),
  quota_total INT,          -- auto: = package
  credits DECIMAL,          -- auto: from settings
  mix_default TEXT REFERENCES mix_library(mix_name),
  statut ENUM ('candidat', 'actif', 'pause', 'inactif'),
  date_debut DATE,
  notes TEXT,
  contract_signed_at TIMESTAMP,
  stripe_account_id TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- SUIVI_MENSUEL (tracking mensuel)
monthly_tracking (
  id UUID PRIMARY KEY,
  mois TEXT,                -- YYYY-MM
  creator_id UUID REFERENCES creators,
  -- Auto-calculated from creator
  package INT,
  quota_total INT,
  mix TEXT,
  -- Auto-calculated quotas by type (based on mix %)
  quota_ootd INT,
  quota_training INT,
  quota_before_after INT,
  quota_sports_80s INT,
  quota_cinematic INT,
  -- Delivery tracking
  livré_ootd INT DEFAULT 0,
  livré_training INT DEFAULT 0,
  livré_before_after INT DEFAULT 0,
  livré_sports_80s INT DEFAULT 0,
  livré_cinematic INT DEFAULT 0,
  -- Computed
  total_livré INT,          -- auto: sum of livré_*
  reste_a_livrer INT,       -- auto: quota_total - total_livré
  statut_livraison TEXT,    -- auto: OK / EN ATTENTE
  detail_reste TEXT,        -- auto: "Reste 1 Cinematic"
  -- Payment
  deadline DATE,
  paiement_statut ENUM ('à_faire', 'en_cours', 'payé'),
  total_a_payer DECIMAL,    -- auto: calculated from rates
  paid_at TIMESTAMP,
  created_at TIMESTAMP
)

-- VIDEOS (vidéos uploadées)
videos (
  id UUID PRIMARY KEY,
  monthly_tracking_id UUID REFERENCES monthly_tracking,
  creator_id UUID REFERENCES creators,
  video_type TEXT,          -- OOTD, Training, etc.
  file_url TEXT,
  thumbnail_url TEXT,
  duration INT,
  resolution TEXT,
  file_size INT,
  status ENUM ('uploaded', 'pending_review', 'approved', 'rejected'),
  rejection_reason TEXT,
  reviewed_at TIMESTAMP,
  reviewed_by UUID,
  created_at TIMESTAMP
)

-- RUSHES (fichiers bruts optionnels)
rushes (
  id UUID PRIMARY KEY,
  monthly_tracking_id UUID REFERENCES monthly_tracking,
  creator_id UUID REFERENCES creators,
  file_url TEXT,
  file_name TEXT,
  file_size INT,
  created_at TIMESTAMP
)

-- CREATOR_PRODUCTS (produits envoyés)
creator_products (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES creators,
  product_name TEXT,
  product_sku TEXT,
  size TEXT,
  shipped_at TIMESTAMP,
  tracking_number TEXT,
  received_at TIMESTAMP
)
```

---

## 🔄 Logique Auto-Calculée

### Quotas par type (basé sur Mix)

```javascript
function calculateQuotas(quotaTotal, mix) {
  const mixRatios = MIX_LIBRARY[mix]; // ex: VOLUME
  return {
    ootd: Math.round(quotaTotal * mixRatios.pct_ootd),
    training: Math.round(quotaTotal * mixRatios.pct_training),
    before_after: Math.round(quotaTotal * mixRatios.pct_before_after),
    sports_80s: Math.round(quotaTotal * mixRatios.pct_sports_80s),
    cinematic: quotaTotal - (ootd + training + before_after + sports_80s) // reste
  };
}
```

### Rémunération (basé sur vidéos livrées)

```javascript
function calculatePayout(monthlyTracking) {
  const rates = VIDEO_RATES;
  return (
    monthlyTracking.livré_ootd * rates.OOTD +
    monthlyTracking.livré_training * rates.Training +
    monthlyTracking.livré_before_after * rates.BeforeAfter +
    monthlyTracking.livré_sports_80s * rates.Sports80s +
    monthlyTracking.livré_cinematic * rates.Cinematic +
    monthlyTracking.credits // bonus mensuel
  );
}
```

---

## 📅 Roadmap Suggérée

### Phase 1 — MVP (2-3 semaines)
- [ ] Landing page + formulaire inscription
- [ ] Dashboard créateur (vue quotas + upload par catégorie)
- [ ] Dashboard admin (liste créateurs + suivi mensuel)
- [ ] Validation vidéos basique
- [ ] Export CSV pour paiements manuels

### Phase 2 — Automatisation (2 semaines)
- [ ] Contrat digital avec signature
- [ ] Notifications email automatiques (rappels deadline)
- [ ] Calcul automatique rémunération
- [ ] Intégration Stripe Connect pour paiements

### Phase 3 — Scale (2 semaines)
- [ ] Zone rushes
- [ ] Historique et analytics
- [ ] App mobile (React Native)
- [ ] API pour intégrations externes

---

## 💰 Estimation Budget

| Poste | Estimation |
|-------|------------|
| Design UI/UX | €1,500-2,500 |
| Développement MVP | €6,000-10,000 |
| Intégrations (Stripe, email) | €1,500-2,500 |
| Infrastructure (1 an) | €300-600 |
| **Total estimé** | **€9,300-15,600** |

**Alternative:** Développement interne (Aria + Supabase + Vercel) = **€2,000-4,000**

---

## ✅ Critères de Succès

1. **Acquisition créateurs:** 10 nouveaux/mois
2. **Taux de complétion:** >85% des quotas mensuels atteints
3. **Qualité:** <10% de vidéos rejetées
4. **NPS créateurs:** >50
5. **Temps admin:** <1h/semaine pour gérer le programme

---

## 📎 Annexes

### A. Source de données
- Google Sheet Cameron: [lien](https://docs.google.com/spreadsheets/d/1SSKE5DSDzG6qHsaswAlPujSm0K_sus_RRR2C8FNjzAc)

### B. À valider avec Toni
- [ ] Tarifs définitifs Training → Cinematic
- [ ] Processus de paiement (Stripe vs virement manuel)
- [ ] Contrat juridique (avocat?)
- [ ] Critères d'acceptation créateurs

---

**Next steps:**
1. ✅ PRD validé
2. Valider les tarifs manquants
3. Décider build interne vs externe
4. Kick-off développement
