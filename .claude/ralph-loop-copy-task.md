# Ralph Loop Task: Rewrite ALL Copy for Open Bar Model

## Mission
Every piece of user-facing text in the webapp still references the OLD model (briefs, missions, quotas, cycles, forfaits, deadlines, objectifs). Rewrite ALL copy to match the new open bar creator model.

## New Model (the truth)
- Creator signs up, gets approved under 48h
- Uploads any video they want, picks the type
- Each validated video = paid at fixed rate (OOTD 100, Training 95, Before/After 120, Sports 80s 140, Cinematic 180 EUR)
- No quotas, no briefs, no deadlines, no minimum, no cap
- Admin reviews and validates/rejects under 48h
- Monthly payouts via IBAN/PayPal/Stripe

## Copy Tone
- French, punchy, direct, no corporate speak
- Target: young French fitness creators 18-30 on TikTok/Instagram
- Key message: "Tu filmes deja. Maintenant tu es paye pour ca."
- Talk like a human, not a brand

## Success Criteria
1. ZERO occurrences of "brief" in user-facing copy (contract legal text excluded)
2. ZERO occurrences of "mission" or "missions" in user-facing copy
3. ZERO occurrences of "cycle" (as in monthly cycle) in user-facing copy
4. ZERO occurrences of "objectif" in user-facing copy
5. ZERO occurrences of "forfait" in user-facing copy
6. ZERO occurrences of "quota" in user-facing copy (except to say "no quotas")
7. ZERO occurrences of "72h" (old validation time, now 48h)
8. get-saas-landing-data.ts fully rewritten for open bar model
9. saas-landing hero component updated (no "Brief", no "Missions du mois", no "32/40")
10. get-apply-page-data.ts rewritten (no "missions mensuelles")
11. app/page.tsx metadata updated
12. app/layout.tsx metadata updated
13. app/login/page.tsx metadata updated
14. app/contract/page.tsx metadata updated
15. app/apply/page.tsx metadata updated
16. app/terms/page.tsx content updated (no "briefs")
17. All TypeScript compiles with zero errors

## Files to Check and Fix
- src/application/use-cases/get-saas-landing-data.ts (MAJOR - full rewrite of steps, imageTextBlocks, qualifier, faqs, action)
- src/features/saas-landing/components/landing-hero.tsx (hardcoded "Brief", "Missions", "32/40")
- src/features/saas-landing/components/*.tsx (check ALL for old copy)
- src/application/use-cases/get-apply-page-data.ts ("missions mensuelles", "brief")
- src/app/page.tsx (metadata "Brief clair")
- src/app/layout.tsx (metadata "missions mensuelles")
- src/app/login/page.tsx (metadata "missions")
- src/app/contract/page.tsx (metadata "missions")
- src/app/apply/page.tsx (metadata "missions mensuelles")
- src/app/terms/page.tsx (content "briefs")
- src/domain/contracts/affiliate-program-contract.ts (keep "Brief" in legal sections but update operational refs)
- ANY other file with old model language

## Verification Command
After all changes, run:
grep -ri "brief\|mission\|cycle mensuel\|objectif du mois\|forfait\|72h" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "contract" | grep -v "ralph-loop"
This should return ZERO results (excluding contract legal text).
