# Ralph Loop Task: Full AIDA Copy Rewrite — Saas Landing Page

## Mission
Rewrite the ENTIRE saas landing page copy (get-saas-landing-data.ts + all saas-landing components) following a strict AIDA structure. Every section must serve its role in the funnel. No filler, no product-selling, no old model language.

## Context
- RetroMuscle = French retro fitness brand
- This page recruits UGC CREATORS, not customers
- Open bar model: upload videos, pick type, get paid per validated video
- Rates: OOTD 100EUR, Training 95EUR, Before/After 120EUR, Sports 80s 140EUR, Cinematic 180EUR
- No quotas, no limits, no deadlines
- Target: French fitness creators 18-30, TikTok/Instagram
- Tone: punchy, direct, conversational French, zero corporate

## AIDA Structure Required

### A — ATTENTION (Hero)
- Stop the scroll. Make them feel seen.
- "Tu filmes deja. Maintenant tu es paye pour ca." (or better)
- Stats tiles: show the open bar model at a glance
- Image overlay: social proof (earnings example)

### I — INTEREST (Flow + Block 1)
- Flow: 3 simple steps (apply → upload → get paid)
- Block 1: Address the #1 pain — brands that ghost/don't pay
- Build trust and credibility

### D — DESIRE (Block 2 + Earnings + Qualifier)
- Block 2: Make them WANT this — show concrete earnings, real numbers
- Earnings section: scenarios with real calculations
- Qualifier: "C'est pour toi si..." — make them self-select

### A — ACTION (FAQ + CTA)
- FAQ: Kill last objections (followers, payment, engagement, validation)
- Final CTA: urgent but not pushy

## Copy Guidelines
- ALL French
- No "brief", "mission", "cycle", "objectif", "forfait" (except negation)
- No product-selling (don't talk about cotton/fabric/quality of clothes)
- Every sentence must serve the creator's decision to apply
- Use real numbers (95-180 EUR, 48h, etc.)
- Talk TO the creator, not ABOUT the program

## Files to Modify
1. src/application/use-cases/get-saas-landing-data.ts — ALL copy data (hero, flow, imageTextBlocks, earnings, qualifier, faqs, action)
2. src/features/saas-landing/components/landing-hero.tsx — hardcoded tiles, image overlays, checkmarks
3. src/features/saas-landing/components/*.tsx — check ALL for stale copy

## Success Criteria
1. Hero section follows ATTENTION pattern — stops scroll, creator feels seen
2. Flow section follows INTEREST pattern — 3 clear steps, no old model refs
3. imageTextBlocks follow INTEREST → DESIRE transition — block 1 = trust, block 2 = concrete desire (earnings/proof)
4. Earnings section creates DESIRE with real number scenarios
5. Qualifier section helps self-selection (for/not-for)
6. FAQ section handles ACTION objections (5-6 questions)
7. Final CTA is clean and urgent
8. ZERO product-selling copy (no cotton, fabric, broderie, etc.)
9. ZERO old model language (brief, mission, cycle, objectif, forfait, 72h)
10. All hardcoded text in landing-hero.tsx updated
11. AIDA flow is coherent top to bottom — each section builds on the previous
12. TypeScript compiles with zero errors
13. All tests pass
