# Facebook Ads Copy Generator — RetroMuscle

Generate professional French ad copy for RetroMuscle Facebook Ads using Eugene Schwartz's 5 Stages of Awareness framework.

## Output Format — ALWAYS 5/5/5

Every ad MUST produce:
- **5 Primary Texts** (stages of awareness, long-form)
- **5 Headlines** (short, punchy, pipe-separated format)
- **5 Descriptions** (concise selling points, 1-2 sentences)

## Brand Rules

- **Language**: French (France), tutoiement casual pour primary texts, vouvoiement pour descriptions
- **Accents**: Toujours corrects (e, e, e, a, c, i, u) — use Unicode escapes in JS
- **NO flower emojis** (pas de fleur, ca match pas la brand)
- **Allowed emojis**: ➡️ (CTA), ✅ (checkmarks), 💪 (muscle). Pas d'autres.
- **Tone**: Direct, confident, zero bullshit. Pas de langue de bois marketing.
- **Formatting**: Retours a la ligne genereux, phrases courtes, impact visuel

## 5 Stages of Awareness (Eugene Schwartz)

### Stage 5 — MOST AWARE (Primary Text #1)
- **Target**: Knows RetroMuscle, ready to buy
- **Approach**: Urgency + offer. Short and direct.
- **Structure**: Offer hook → "Tu connais deja" → scarcity → CTA
- **Length**: ~300-350 chars

### Stage 4 — PRODUCT AWARE (Primary Text #2)
- **Target**: Knows RetroMuscle exists, needs convincing
- **Approach**: Social proof + product specs
- **Structure**: Offer hook → "12 000+ clients" → features breakdown (340G, broderie, coton pur, durabilite) → CTA
- **Length**: ~650-700 chars

### Stage 3 — SOLUTION AWARE (Primary Text #3)
- **Target**: Wants quality sportswear, comparing options
- **Approach**: Benefits-focused, checkmark format
- **Structure**: Offer hook → "Tu veux des vetements qui durent?" → 3 benefits with ✅ → differentiation → CTA
- **Length**: ~600-650 chars

### Stage 2 — PROBLEM AWARE (Primary Text #4)
- **Target**: Frustrated with cheap sportswear
- **Approach**: Agitate the problem, then solve it
- **Structure**: Pain story (t-shirt foutu en 3 mois) → "Le probleme? 180G" → "La solution? 340G" → proof → CTA → offer at end
- **Length**: ~700-770 chars

### Stage 1 — UNAWARE (Primary Text #5)
- **Target**: Doesn't know they need better sportswear
- **Approach**: Curiosity hook, sensory experience
- **Structure**: "Prends ton t-shirt" → tactile comparison → imagination → reveal product → social proof → offer at end
- **Length**: ~600-650 chars

## Headlines Format
Short, impactful, pipe-separated sections:
1. Collection/brand + key feature
2. Current offer
3. Key spec + differentiator
4. Durability promise
5. Brand + tagline

## Descriptions Format
Concise, 1-2 sentences max. Cover:
1. Product specs summary + offer
2. Offer + sensory hook
3. Social proof + durability
4. Brand promise (short)
5. Anti-waste message + urgency

## Key Selling Points (use across all copy)
- **340G extra epais** (2,5x plus lourd que le standard 180G)
- **Broderie cousue** (pas imprimee — ne craque pas, ne s'efface pas)
- **100% coton pur** (pas de melange polyester)
- **Collection Golden Era** (style retro bodybuilding)
- **12 000+ clients**
- **Durabilite**: annees, pas saisons
- **Stock limite** / certaines pieces ne seront pas reproduites

## Current Offer (Spring 2026)
- "OFFRE DE PRINTEMPS : Jusqu'a -15% sur tout le site"
- NO mention of: hiver, Noel, Nouvel An, decembre, -5°C, Christmas, resolutions

## Copywriting Agents
When generating copy, use these specialized agents for inspiration:
- `eugene-schwartz-copywriter` — stages of awareness, market sophistication
- `gary-halbert-copywriter` — street-smart, emotional hooks
- `joe-sugarman-copywriter` — curiosity-driven, slippery slide
- `stefan-georgi-copywriter` — authentic storytelling, funnel optimization
- `david-ogilvy-copywriter` — research-driven, brand-building

## Example Review Output

After generating copy, ALWAYS present it in this format for user review:

```
## PRIMARY TEXTS (5/5)

#1 — MOST AWARE (XXX chars)
> [full text]

#2 — PRODUCT AWARE (XXX chars)
> [full text]

#3 — SOLUTION AWARE (XXX chars)
> [full text]

#4 — PROBLEM AWARE (XXX chars)
> [full text]

#5 — UNAWARE (XXX chars)
> [full text]

## HEADLINES (5/5)
1. [headline]
2. [headline]
3. [headline]
4. [headline]
5. [headline]

## DESCRIPTIONS (5/5)
1. [description]
2. [description]
3. [description]
4. [description]
5. [description]

## Checks:
- [ ] Zero winter/Christmas/New Year references
- [ ] Zero flower emojis
- [ ] French accents correct
- [ ] Line breaks proper
- [ ] 5 stages of awareness respected
- [ ] Offer consistent across all texts
```
