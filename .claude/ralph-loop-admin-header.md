# Ralph Loop Task: Fix Admin Header & Border Soup

## Mission
Fix the admin page header, navigation, and metric cards to eliminate "border soup" — too many bordered elements competing at the same visual weight. Apply a clear hierarchy where only content cards have borders.

## Fixes to Implement

### 1. Nav links — text-only, no bordered pills
- File: src/components/layout/site-header.tsx (admin nav section)
- Remove bordered pill styling from admin nav links
- Active state: text-foreground font-semibold (or underline), no bg-frost
- Inactive: text-foreground/50, no border, no background
- Mobile: same — plain text, no pills

### 2. Remove duplicate "Candidatures" button from page body
- File: src/features/admin-dashboard/admin-dashboard-page.tsx
- The "Candidatures" button in the page header duplicates the nav link
- Remove the entire button wrapper div (keep just the SectionHeading)

### 3. Metric cards — remove border, use shadow only
- File: src/components/ui/metric.tsx
- Remove border-[1.5px] and border-line
- Keep shadow-sm and bg-white/95 for card separation
- Urgent state: use border-l-4 border-primary instead of full border

### 4. Collapsible sections — section divider style, not card-like
- File: src/features/admin-dashboard/admin-dashboard-page.tsx
- The details/summary should be a clean section divider, not a bordered card
- Use: border-t border-line pt-4 pb-2 for the summary
- Remove: rounded-2xl border-[1.5px] border-line bg-white/95 shadow-sm
- Keep the chevron icon

### 5. SectionHeading — lighter for admin context
- File: src/features/admin-dashboard/admin-dashboard-page.tsx
- Remove the "Manager" eyebrow badge — admin already knows their role
- Keep the title and month subtitle

## Rules
- Keep all existing functionality
- Keep Tailwind + existing component library
- French accents must be preserved (use literal characters, NOT unicode escapes)
- TypeScript must compile with zero errors
- All tests must pass

## Success Criteria
1. Nav links have NO border or background (text-only with opacity/weight for active state)
2. No duplicate "Candidatures" button in page body
3. Metric cards have NO full-perimeter border (shadow only, urgent = left accent)
4. Collapsible sections styled as dividers, not cards
5. No "Manager" eyebrow badge on admin page
6. TypeScript compiles with zero errors
7. All tests pass
8. No unicode escape sequences in JSX (literal French characters only)
