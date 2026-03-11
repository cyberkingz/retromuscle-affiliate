# Facebook Ads Copy Update via AdsPower MCP

Update Facebook Ads copy through the AdsPower anti-detect browser using the `mcp__adspower-devtools__*` MCP tools.

## Prerequisites
- AdsPower desktop app running with API enabled at `http://127.0.0.1:50325`
- "Magma" profile (Facebook) launched - user_id: `k16m6tih`
- MCP server `adspower-devtools` connected (check with ToolSearch "adspower")
- Instructions file at `fb_spring_agent_instructions.json` in project root

## Standard Ad Structure — ALWAYS 5/5/5

Every French ad MUST have:
- **5 Primary Texts** — based on Eugene Schwartz's 5 Stages of Awareness (see `/fb-ads-copy` skill)
- **5 Headlines** — short, punchy, pipe-separated
- **5 Descriptions** — concise selling points

Use the `/fb-ads-copy` skill to generate or review ad copy before writing it into the editor.

## Critical Patterns & Workarounds

### 1. NEVER use `fill()` on Facebook React textboxes
Facebook Ads Manager uses React textarea components. The MCP `fill()` command APPENDS text instead of replacing. `Ctrl+A` also fails to select all text.

**ALWAYS use the React native setter via `evaluate_script`:**
```javascript
() => {
  const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  ).set;
  const textareas = document.querySelectorAll('textarea');

  function setReactValue(textarea, newValue) {
    nativeTextAreaValueSetter.call(textarea, newValue);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  }

  setReactValue(textareas[INDEX], 'new value here');
  return {newValue: textareas[INDEX].value};
}
```

### 2. NEVER use `fill()` on Facebook filter inputs either
Same React problem. Use `HTMLInputElement.prototype` native setter:
```javascript
() => {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set;
  const inputs = document.querySelectorAll('input');
  let filterInput = null;
  for (const input of inputs) {
    if (input.value && input.value.length > 15 && /^\d+$/.test(input.value)) {
      filterInput = input;
      break;
    }
  }
  nativeInputValueSetter.call(filterInput, 'NEW_AD_ID_HERE');
  filterInput.dispatchEvent(new Event('input', { bubbles: true }));
  filterInput.dispatchEvent(new Event('change', { bubbles: true }));
  return {success: true, newValue: filterInput.value};
}
```

### 3. Scrolling the center edit panel
```javascript
() => {
  const el = document.querySelector('.x1iyjqo2.xs83m0k.xdl72j9.x6ikm8r.x1odjw0f');
  if (el) { el.scrollTop = TARGET_PX; return {scrollTop: el.scrollTop, scrollHeight: el.scrollHeight}; }
  return 'not found';
}
```
- `scrollTop = 1200` shows Primary text field
- `scrollTop = 2400` shows Headlines and Descriptions

### 4. NEVER navigate directly to edit URLs
Navigating to `adsmanager.facebook.com/.../edit/standalone?...` causes "sorry.php" error. Instead:
1. Stay on the Ads list view
2. Use the filter bar to filter by Ad ID
3. Click the ad row, then click "Edit" button (or Ctrl+U)

### 5. "Add text option" buttons — CRITICAL DISTINCTION
There are SEPARATE "Add text option" buttons for Primary Text and Description. They look identical but have different UIDs.

**To add Primary Text slots:**
1. Click ON the primary text textarea first (to focus it)
2. Its own "Add text option" button appears nearby (different UID from the description one)
3. Click THAT button

**To add Description slots:**
1. The description "Add text option" is always visible below descriptions
2. Click it directly

**NEVER confuse them** — clicking the wrong one adds slots to the wrong section. Always verify which UID you're clicking by checking the snapshot context.

### 6. Set real copy directly — NO placeholders
When adding new text slots, set the final ad copy directly via React native setter. Do NOT use temporary placeholder values (t2, t3, d2, etc.) — it wastes time and risks publishing with placeholder text.

### 7. Textarea field mapping (when all 5 variants present)
```
Index 0-4:   Primary text variants 1-5
Index 5-9:   Headline variants 1-5
Index 10-14: Description variants 1-5
Index 15:    URL parameters (leave empty)
```
Note: This mapping only applies AFTER all 5 variants are added. When adding slots incrementally, new textareas appear at shifting indices — always check with `evaluate_script` to find empties.

### 8. Long text (Primary text) may crash the browser tab
If using `type_text` with very long text (>500 chars), the tab may crash. Always use `evaluate_script` with the React native setter for long texts.

### 9. French accent handling
Use Unicode escapes in evaluate_script strings:
- `\u00e9`=e, `\u00e8`=e, `\u00ea`=e, `\u00e0`=a, `\u00e7`=c, `\u00ee`=i
- `\u2019`=' (curly apostrophe — Facebook uses these, not straight ')
- `\u00c9`=E, `\u00c0`=A

## Visual Media Check — CRITICAL

Before updating any ad copy, check if the ad's visual media (image/video) contains outdated offer text (e.g. "offre d'hiver", "Christmas", "20% off", etc.).

**If the visual has outdated offer text:**
1. Do NOT update the ad copy — it would be incoherent with the visual
2. Instead, **turn the ad OFF** via the On/Off switch in the editor
3. Publish to save the off state
4. Move to the next ad

**How to check:** Take a screenshot of the ad preview in the editor. Look for offer text baked into the image/video. Common signs: promotional banners, text overlays with seasonal offers.

## Workflow per Ad

1. **Filter**: Edit filter > set Ad ID via React native setter > Apply
2. **UNCHECK previous ad**: Before selecting the new ad, make sure no other ad checkbox is checked in the table. If a previous ad is still checked, uncheck it first. Otherwise Ctrl+U opens the **bulk editor** (multi-ad mode) instead of single-ad editor.
3. **Open editor**: Click new ad row checkbox > Ctrl+U (single ad editor)
4. **Snapshot**: Take snapshot to identify current field counts and UIDs
5. **Check visual media**: Take a screenshot of the ad preview. If the image/video has outdated offer text (e.g. "offre d'hiver"), turn the ad OFF and skip to step 9.
6. **Add slots if needed**: Add Primary Text and Description slots to reach 5/5/5
7. **Set all copy**: Use `evaluate_script` with React native setter — set real copy directly
8. **REVIEW (mandatory)**: Run the `/fb-ads-review` skill before EVERY publish. This includes:
   - Automated verification (no winter/Christmas/flower references, no placeholders)
   - Full copy display to user (all 15 fields with stage labels)
   - Copywriting quality checks
   - User must explicitly approve before publish
9. **Publish**: Only after user approval from review step (or after turning off)
10. **Next ad**: Edit filter > change Ad ID > repeat (remember step 2: uncheck previous ad first!)

## Verification Script (French ads)
```javascript
() => {
  const textareas = document.querySelectorAll('textarea');
  const fields = [];
  for (let i = 0; i < textareas.length; i++) {
    const val = textareas[i].value;
    if (!val) continue;
    const issues = [];
    if (val.includes('\u{1F338}')) issues.push('flower emoji');
    if (/hiver/i.test(val)) issues.push('hiver');
    if (/d[e\u00e9]cembre/i.test(val)) issues.push('decembre');
    if (/nouvel.?an/i.test(val)) issues.push('Nouvel An');
    if (/-5\s*\u00b0?\s*C/i.test(val)) issues.push('-5C');
    if (/no[e\u00eb]l/i.test(val)) issues.push('Noel');
    if (/r\u00e9solution/i.test(val)) issues.push('Resolution');
    if (/nouvelle ann\u00e9e/i.test(val)) issues.push('Nouvelle annee');
    if (/^placeholder\d*$/.test(val) || /^t\d$/.test(val) || /^d\d$/.test(val)) issues.push('PLACEHOLDER');
    fields.push({i: i, len: val.length, preview: val.substring(0, 60), issues: issues.length > 0 ? issues : 'clean'});
  }
  return {totalFields: fields.length, fields: fields};
}
```

## Ad Account Details
- Account: `act_923635548436648`
- Business ID: `700127593071810`
- Page: RetroMuscle Golden Era Dream (`391083427431308`)

## AdsPower Connection
- API: `http://127.0.0.1:50325` with Bearer token
- API key: `c3c8e639c1bdba96a8d7e6b163eab6b00070eb8f0437c63c`
- Magma profile user_id: `k16m6tih`
- Launcher script: `/tmp/adspower-mcp-launcher.sh`
