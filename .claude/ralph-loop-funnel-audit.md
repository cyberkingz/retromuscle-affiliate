# Ralph Loop Task: Full Funnel Audit A-Z

## Mission
Audit the ENTIRE creator funnel from landing page to payout, verifying that every page, component, and data flow is consistent with the new open bar model. No old model remnants (packages, mixes, quotas, briefs, cycles, missions, deadlines, forfaits) should appear anywhere.

## The Funnel Steps to Audit
1. **Landing page (/)** - saas-landing - hero, flow steps, image blocks, earnings, qualifier, FAQ, CTA
2. **Landing page (/programme)** - landing page - hero, rates table, goals, FAQ
3. **Apply page (/apply)** - signup form, marketing copy, metadata
4. **Login page (/login)** - metadata, messaging
5. **Onboarding (/onboarding)** - wizard steps (should be 2: personal + profile), form fields (NO packageTier, NO mixName)
6. **Contract (/contract)** - highlights, signing flow
7. **Dashboard (/dashboard)** - creator header, progress card, video type grid, upload card, activity feed, rushes
8. **Uploads (/uploads)** - video type selection, upload flow
9. **Payouts (/payouts)** - payout breakdown, payment history
10. **Settings (/settings)** - payout profile
11. **Admin dashboard (/admin)** - creators table, monthly tracking table, metrics, payments, review queue
12. **Admin applications** - application review flow
13. **Admin config** - should only show rates (no packages, no mixes tables)
14. **Terms (/terms)** - legal text
15. **Privacy (/privacy)** - if applicable

## What to Check at Each Step
- Page metadata (title, description) - no old model language
- Component props and data shapes - no packageTier, mixName, quotaTotal, monthlyCredits, deadline
- User-facing text - no "brief", "mission", "cycle", "objectif", "forfait", "quota" (except negation)
- Data flow - use-case returns correct shape, component consumes it correctly
- TypeScript types - all aligned with new domain types
- Functional correctness - does the flow make sense for open bar model?

## Success Criteria
1. Every page in the funnel loads without TS errors
2. No old model language in ANY user-facing text across ALL pages
3. No old model types (PackageTier, MixName, MixDefinition, etc.) referenced anywhere outside contract/empty modules
4. Onboarding is exactly 2 steps (personal info + creator profile)
5. Dashboard shows delivered videos + earnings (no quota progress)
6. Payout breakdown is simple: videos x rate = subtotal per type, grand total (no monthlyCredits)
7. Admin config only shows video rates (no packages table, no mixes table)
8. Application form has no packageTier or mixName fields
9. All earnings calculations use calculatePayout(delivered, rates) with 2 args (not 3)
10. All tracking summaries use summarizeTracking(delivered) with 1 arg (not 2)
11. TypeScript compiles with zero errors
12. All tests pass
