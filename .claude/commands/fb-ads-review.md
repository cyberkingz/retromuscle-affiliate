# Facebook Ads Copy Review — RetroMuscle

Review ALL ad copy fields before publishing. This skill is called by `/fb-ads-update` before every publish.

**RULE: NEVER publish without running this review first.**

## Step 1 — Extract All Fields

Run this script to extract every textarea value from the editor:
```javascript
() => {
  const textareas = document.querySelectorAll('textarea');
  const result = [];
  for (let i = 0; i < textareas.length; i++) {
    const val = textareas[i].value;
    if (val) result.push({i: i, val: val});
  }
  return result;
}
```

## Step 2 — Verify Structure (5/5/5)

Check the section counters in the snapshot:
- **Primary text**: must show "5 of 5"
- **Headline**: must show "5 of 5"
- **Description**: must show "5 of 5"

If any section is not 5/5, STOP and fix before continuing.

## Step 3 — Automated Checks

Run the verification script to catch issues programmatically:
```javascript
() => {
  const textareas = document.querySelectorAll('textarea');
  const issues = [];
  let primaryCount = 0, headlineCount = 0, descCount = 0;

  for (let i = 0; i < textareas.length; i++) {
    const val = textareas[i].value;
    if (!val) continue;

    const fieldIssues = [];

    // Banned content
    if (val.includes('\u{1F338}')) fieldIssues.push('FLOWER EMOJI');
    if (/hiver/i.test(val)) fieldIssues.push('hiver');
    if (/d[e\u00e9]cembre/i.test(val)) fieldIssues.push('decembre');
    if (/nouvel.?an/i.test(val)) fieldIssues.push('Nouvel An');
    if (/-5\s*\u00b0?\s*C/i.test(val)) fieldIssues.push('-5C');
    if (/no[e\u00eb]l/i.test(val)) fieldIssues.push('Noel');
    if (/r\u00e9solution\s*\d{4}/i.test(val)) fieldIssues.push('Resolution YYYY');
    if (/nouvelle ann\u00e9e/i.test(val)) fieldIssues.push('Nouvelle annee');
    if (/christmas|x-?mas/i.test(val)) fieldIssues.push('Christmas');
    if (/20\s*%\s*off/i.test(val)) fieldIssues.push('20% off (old offer)');
    if (/dec(ember)?\s*31/i.test(val)) fieldIssues.push('Dec 31');

    // Placeholders
    if (/^(placeholder\d*|t\d|d\d)$/.test(val)) fieldIssues.push('PLACEHOLDER');

    // Quality checks
    if (val.length < 10 && i < 5) fieldIssues.push('TOO SHORT for primary text');
    if (val.length > 100 && i >= 5 && i <= 9) fieldIssues.push('TOO LONG for headline');

    // Categorize by position
    if (i <= 4) primaryCount++;
    else if (i <= 9) headlineCount++;
    else if (i <= 14) descCount++;

    if (fieldIssues.length > 0) {
      issues.push({i: i, issues: fieldIssues, preview: val.substring(0, 60)});
    }
  }

  return {
    structure: {primary: primaryCount, headlines: headlineCount, descriptions: descCount},
    issues: issues.length > 0 ? issues : 'ALL CLEAN',
    total: primaryCount + headlineCount + descCount
  };
}
```

## Step 4 — Human-Readable Review

Display ALL copy to the user in this exact format:

```
## AD COPY REVIEW — [Ad Name]

### PRIMARY TEXTS (5/5)

**#1 — MOST AWARE** (XXX chars)
> [full text verbatim]

**#2 — PRODUCT AWARE** (XXX chars)
> [full text verbatim]

**#3 — SOLUTION AWARE** (XXX chars)
> [full text verbatim]

**#4 — PROBLEM AWARE** (XXX chars)
> [full text verbatim]

**#5 — UNAWARE** (XXX chars)
> [full text verbatim]

---

### HEADLINES (5/5)
1. [headline verbatim]
2. [headline verbatim]
3. [headline verbatim]
4. [headline verbatim]
5. [headline verbatim]

---

### DESCRIPTIONS (5/5)
1. [description verbatim]
2. [description verbatim]
3. [description verbatim]
4. [description verbatim]
5. [description verbatim]

---

### AUTOMATED CHECKS
- [ ] Structure: 5 primary / 5 headlines / 5 descriptions
- [ ] Zero winter/Christmas/New Year/hiver references
- [ ] Zero flower emojis (🌸)
- [ ] Zero placeholders (t2, d3, etc.)
- [ ] French accents correct (e, e, e, a, c)
- [ ] Curly apostrophes (', not ')
- [ ] Line breaks clean (no double spaces, no orphan lines)
- [ ] Offer consistent: "OFFRE DE PRINTEMPS : Jusqu'a -15%"
- [ ] CTA present in each primary text (➡️)
- [ ] "Stock limite" mention in each primary text

### COPYWRITING QUALITY
- [ ] Stage 1 (Most Aware): Short, urgent, assumes knowledge
- [ ] Stage 2 (Product Aware): Social proof + specs breakdown
- [ ] Stage 3 (Solution Aware): Benefits with checkmarks
- [ ] Stage 4 (Problem Aware): Pain → problem → solution arc
- [ ] Stage 5 (Unaware): Curiosity hook, sensory, no brand mention at start
- [ ] Headlines: Punchy, pipe-separated, varied angles
- [ ] Descriptions: Concise, different selling points each
```

## Step 5 — Decision

After displaying the review:
- If ALL checks pass → Ask user: **"On publie ?"**
- If ANY issue found → Flag it clearly, suggest fix, do NOT publish

## Common Issues to Watch For

| Issue | Fix |
|-------|-----|
| Accents manquants (e au lieu de e) | Re-set with Unicode escapes |
| Apostrophe droite (') au lieu de courbe (') | Use `\u2019` in JS |
| "hiver" still in text | Search & replace via evaluate_script |
| Description trop longue | Facebook truncates at ~125 chars |
| Headline trop long | Facebook truncates at ~40-50 chars |
| Duplicate content between fields | Each field must be unique |
| Missing CTA (➡️) | Add at end of each primary text |
| Inconsistent offer text | Must always say "-15%" not "15 %" |
