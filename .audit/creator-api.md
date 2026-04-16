# Security Audit v3 -- Creator-Facing API Routes

**Scope:** All non-admin API routes under `src/app/api/`
**Date:** 2026-04-15
**Auditor:** Claude Opus 4.6 (automated)

---

## Route Inventory

| # | Route | Methods | Auth Guard | Origin Check | Body Limit | Rate Limit |
|---|-------|---------|------------|--------------|------------|------------|
| 1 | `/api/applications/draft` | GET, PUT, DELETE | requireApiRole("affiliate") | PUT, DELETE | PUT: 16KB | No |
| 2 | `/api/applications/me` | GET, POST | requireApiRole("affiliate") | POST | POST: 64KB | No |
| 3 | `/api/auth/me` | GET | None (self-resolves) | No | N/A | No |
| 4 | `/api/auth/redirect-target` | GET | requireApiSession | No | N/A | Yes (120/min) |
| 5 | `/api/auth/resend-verification` | POST | None (unauthenticated) | Yes | 2KB | Yes (3/min) |
| 6 | `/api/auth/sign-in` | POST | None (unauthenticated) | Yes | 8KB | Yes (20/min) |
| 7 | `/api/auth/sign-out` | POST | None (best-effort) | Yes | N/A | No |
| 8 | `/api/auth/sign-up` | POST | None (unauthenticated) | Yes | 8KB | Yes (10/min) |
| 9 | `/api/contract/sign` | POST | requireApiRole("affiliate") | Yes | 6KB | Yes (30/min) |
| 10 | `/api/creator/[id]/dashboard` | GET | requireApiSession + IDOR check | No | N/A | No |
| 11 | `/api/creator/payout-profile` | GET, POST | requireApiRole("affiliate") | POST | POST: 12KB | Yes (GET:60, POST:20/min) |
| 12 | `/api/creator/uploads/rush` | POST | requireApiRole("affiliate") | Yes | 16KB | Yes (40/min) |
| 13 | `/api/creator/uploads/rush/signed-url` | POST | requireApiRole("affiliate") | Yes | 12KB | Yes (40/min) |
| 14 | `/api/creator/uploads/video` | POST | requireApiRole("affiliate") | Yes | 16KB | Yes (40/min) |
| 15 | `/api/creator/uploads/video/signed-url` | POST | requireApiRole("affiliate") | Yes | 12KB | Yes (60/min) |
| 16 | `/api/health` | GET | requireApiRole("admin") | No | N/A | No |
| 17 | `/api/onboarding/options` | GET | None (public) | No | N/A | No |
| 18 | `/api/rushes/preview` | GET | requireApiSession + ownership check | No | N/A | Yes (240/min) |
| 19 | `/api/videos/preview` | GET | requireApiSession + ownership check | No | N/A | Yes (240/min) |

---

## CRITICAL Findings

### None identified.

The critical issues from v1/v2 (user_metadata.role fallback for self-promotion to admin) appear to have been fixed. `resolve-auth-session.ts:69-74` now only reads from `app_metadata.role` and explicitly notes the security rationale.

---

## HIGH Findings

### [HIGH] H-01: IDOR in Dashboard Route -- Creator ID Taken from URL Path Parameter

**Location:** `src/app/api/creator/[id]/dashboard/route.ts:31`
**Issue:** The `creatorId` comes from the URL path parameter `context.params.id`, not from the authenticated session. Although the route performs an IDOR check (lines 42-64) by looking up the session user's own creator ID and comparing, this defense relies on the `findCreatorIdForUser` function which has a fallback to email-based lookup (`findCreatorIdForUserEmail`). If a creator's email in the database differs from their auth email (e.g., after an email change), the ownership check could produce a false negative (denying legitimate access) or, in theory, a false positive if email reuse occurs between different auth accounts.
**Risk:** Theoretically limited because the email fallback (`resolve-auth-session.ts:152-178`) queries the `creators` table by email. If two Supabase auth users share the same email (unlikely but possible in misconfigured setups), user A could view user B's dashboard by supplying B's `creatorId` in the URL.
**Fix:**
1. Remove the email-based fallback in `findCreatorIdForUser` or make it a strict secondary check that also verifies the `user_id` column is null (meaning the creator hasn't been linked to a user yet).
2. Prefer deriving creatorId exclusively from `auth.session.userId` via the `creators.user_id` column for creator-facing routes, eliminating path-parameter-based access for non-admin users entirely.

### [HIGH] H-02: Missing isAllowedOrigin() on Multiple State-Reading GET Endpoints

**Location:**
- `src/app/api/applications/draft/route.ts:9` (GET)
- `src/app/api/applications/me/route.ts:10` (GET)
- `src/app/api/creator/[id]/dashboard/route.ts:17` (GET)
- `src/app/api/creator/payout-profile/route.ts:35` (GET)
- `src/app/api/rushes/preview/route.ts:15` (GET)
- `src/app/api/videos/preview/route.ts:15` (GET)

**Issue:** While GET requests are generally not CSRF targets (they don't mutate state), several of these endpoints return sensitive financial data (payout profile, payment history, estimated payouts) or generate signed URLs (preview endpoints). The `SameSite=Lax` cookie policy allows GET requests from cross-origin navigations, meaning a malicious site can embed `<img>` or `<script>` tags targeting these JSON endpoints. Browsers may allow reading the response in certain contexts.
**Risk:** Information disclosure of creator financial data (IBAN last 4 digits, PayPal email, payout amounts) or signed storage URLs via cross-origin GET requests.
**Fix:** While fixing all GETs with origin checks is uncommon, consider adding `X-Content-Type-Options: nosniff` and ensuring responses have `Content-Type: application/json` (already done via `NextResponse.json`). For the preview signed URL endpoints specifically, consider requiring a POST method instead of GET since they generate new resource URLs.

### [HIGH] H-03: Missing Rate Limiting on State-Mutating Creator Endpoints

**Location:**
- `src/app/api/applications/draft/route.ts` -- PUT and DELETE handlers have no rate limit
- `src/app/api/applications/me/route.ts` -- GET and POST handlers have no rate limit
- `src/app/api/auth/sign-out/route.ts:13` -- POST handler has no rate limit

**Issue:** The draft save (PUT), draft delete (DELETE), and application submit (POST) endpoints have no rate limiting whatsoever. An authenticated attacker can spam these endpoints thousands of times per second, causing excessive database load and potentially exhausting Supabase service role quota.
**Risk:**
- Denial of service via rapid draft upserts (each triggers a Supabase `upsert` with the service role key)
- Application spam: rapidly creating/updating applications before the terminal status check fires
- sign-out endpoint can be used to enumerate valid sessions or create amplification load against Supabase admin API
**Fix:** Add `rateLimit()` calls to all of these handlers, matching the pattern used in other endpoints. Suggested limits: draft PUT/DELETE: 30/min, application POST: 10/min, sign-out: 10/min.

### [HIGH] H-04: Signed Upload URLs Have No File Type Restriction

**Location:**
- `src/app/api/creator/uploads/rush/signed-url/route.ts:106-109`
- `src/app/api/creator/uploads/video/signed-url/route.ts:137-141`

**Issue:** The signed upload URL is created with `createSignedUploadUrl(key, { upsert: false })` but no `contentType` restriction is passed. The storage key path includes the user-supplied filename (after sanitization), but there is no server-side enforcement of allowed MIME types or file extensions. A creator could upload an HTML file, SVG with embedded JavaScript, or an executable, and the signed URL would accept it.
**Risk:** If Supabase Storage serves these files from the same origin (or a subdomain), uploaded HTML/SVG files could execute JavaScript in the context of the application's origin, leading to stored XSS. Executable uploads could be used for malware distribution.
**Fix:**
1. Validate the file extension in `sanitizeFilename()` against an allowlist (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm` for videos; similar for rushes).
2. Pass `contentType` option to `createSignedUploadUrl()` to restrict the upload to specific MIME types.
3. Ensure the Supabase Storage bucket policy restricts allowed MIME types.
4. Verify that Supabase Storage serves files from a separate domain (not the app origin).

---

## MEDIUM Findings

### [MEDIUM] M-01: Application Body Size Limit is Generous (64KB)

**Location:** `src/app/api/applications/me/route.ts:47`
**Issue:** The application submission endpoint allows 64KB request bodies via `readJsonBodyWithLimit(request, { maxBytes: 64 * 1024 })`. The actual payload fields (name, email, whatsapp, country, address, two social URLs, two follower counts, boolean) should never exceed 2-3KB. A 64KB limit allows an attacker to pad the JSON with extraneous fields that are ignored but still parsed and allocated in memory.
**Risk:** Minor resource waste; combined with the lack of rate limiting (H-03), this could amplify a DoS attack.
**Fix:** Reduce to `8 * 1024` (8KB), matching the sign-in/sign-up routes.

### [MEDIUM] M-02: Draft formData Accepts Arbitrary JSON Without Schema Validation

**Location:** `src/app/api/applications/draft/route.ts:59`
**Issue:** The draft PUT handler stores `body.formData` directly into the database after only checking that it is an object: `const formData = body.formData && typeof body.formData === 'object' ? body.formData : {};`. No schema validation is applied. The draft is stored as a JSONB column via the service role key.
**Risk:** An attacker can store arbitrary JSON structures (deeply nested objects, arrays with millions of elements) in the `onboarding_drafts` table. This is a mass assignment issue -- any JSON keys are accepted and stored. When this draft is later read and rendered by the frontend, unexpected properties could cause client-side errors or be used for stored data injection if any field is rendered without sanitization.
**Fix:** Validate `formData` against a schema that only allows the known draft fields (fullName, whatsapp, country, address, socialTiktok, socialInstagram, followers_tiktok, followers_instagram). Reject or strip unknown keys.

### [MEDIUM] M-03: readJsonBodyWithLimit Reads Full Body Before Size Check

**Location:** `src/lib/request-body.ts:15-16`
**Issue:** The function calls `const text = await request.text()` which reads the entire request body into memory before checking `Buffer.byteLength(text, 'utf8') > options.maxBytes`. While the `Content-Length` header is checked first (line 8-13), the header is optional and can be omitted. A client that omits `Content-Length` can send a large body that is fully buffered in memory before being rejected.
**Risk:** Memory exhaustion on the server. In serverless environments (Vercel), this can cause function OOM and increased costs.
**Fix:** Use streaming body consumption with a byte counter that aborts early once the limit is exceeded:
```typescript
const reader = request.body?.getReader();
// ... accumulate chunks, abort if total exceeds maxBytes
```

### [MEDIUM] M-04: isAllowedOrigin() Defaults to Rejecting Missing Origin Headers

**Location:** `src/lib/origin.ts:17`
**Issue:** The `isAllowedOrigin()` function returns `false` when the `Origin` header is missing (unless `allowMissingOrigin: true` is explicitly passed). This is the secure default. However, this means non-browser clients (curl, Postman, server-to-server) cannot call state-mutating endpoints. This is generally fine for a web app, but note that **same-origin form submissions in some browsers do not send an Origin header**, which could block legitimate form POSTs.

More importantly, the previous audit flagged the opposite problem -- that missing Origin was ALLOWED. The fix has been applied correctly. This is now a defense-in-depth win.
**Risk:** Low. Edge-case browser behavior might fail to include Origin on same-origin POSTs (rare, mainly older browsers).
**Fix:** No action needed -- this is the correct secure default. Document the behavior for API consumers.

### [MEDIUM] M-05: Preview Endpoints Accept fileUrl in GET Query Parameters

**Location:**
- `src/app/api/rushes/preview/route.ts:47`
- `src/app/api/videos/preview/route.ts:47`

**Issue:** The preview endpoints receive `fileUrl` as a GET query parameter. Query parameters appear in access logs, browser history, and Referer headers. The file path contains the user ID and tracking IDs, which are quasi-sensitive. The path traversal checks (no leading `/`, no `..`) are in place and correct.
**Risk:** Information leakage of user IDs and tracking IDs via URL query parameters in logs, browser history, and Referer headers.
**Fix:** Switch preview endpoints to POST method to keep fileUrl out of query strings, or accept the fileUrl as a request header.

### [MEDIUM] M-06: Upload Record Routes Do Not Verify File Exists in Storage

**Location:**
- `src/app/api/creator/uploads/rush/route.ts:90-98`
- `src/app/api/creator/uploads/video/route.ts:131-139`

**Issue:** The rush and video record endpoints validate that `fileUrl` starts with the user's ID prefix, then immediately create a database record for it. They do NOT verify that the file actually exists in Supabase Storage. An attacker can register database records pointing to non-existent files, polluting the tracking data with phantom uploads.
**Risk:**
- Inflated delivery counts (if the downstream review/approval process doesn't re-verify file existence)
- Data integrity issues in payout calculations
- Admin reviewer time wasted on non-existent files
**Fix:** Before inserting the database record, verify the file exists in storage using `supabase.storage.from(bucket).list()` or a HEAD request to the file URL. Alternatively, accept that signed upload URLs are the gatekeeper and ensure the record endpoint is only called after a confirmed upload (enforce via a server-side upload confirmation flow).

### [MEDIUM] M-07: Contract Sign Route Stores Client IP from Spoofable Headers

**Location:** `src/app/api/contract/sign/route.ts:51-62`
**Issue:** The `getClientIp()` function reads from `x-forwarded-for`, `x-real-ip`, and `cf-connecting-ip` headers and stores the result in the `creator_contract_signatures` table. While it validates that the result is a valid IP via `isIP()`, these headers are trivially spoofable by the client. The stored IP has legal significance (contract signature provenance).
**Risk:** A creator could forge their IP address in the contract signature record, potentially undermining the legal validity of the signature audit trail. For example, they could claim the signature was made from a jurisdiction where they weren't located.
**Fix:**
1. On Vercel, trust only the first value in `x-forwarded-for` (set by Vercel's edge network, not the client). Document this assumption.
2. Consider logging both the forwarded IP and a note about whether the header chain is trusted.
3. When deployed behind Cloudflare, prefer `cf-connecting-ip` as it is set by Cloudflare, not the client.

### [MEDIUM] M-08: Sign-Up Fallback Auto-Sign-In Bypasses Email Confirmation Intent

**Location:** `src/app/api/auth/sign-up/route.ts:119-134`
**Issue:** After a successful sign-up that doesn't return a session (expected when email confirmation is enabled), the code falls back to attempting `signInWithPassword()` with the same credentials. If the Supabase project has email confirmation enabled but `signInWithPassword` still succeeds before confirmation (a Supabase configuration edge case), this bypasses the email verification requirement.
**Risk:** An attacker could create an account with any email (including someone else's) and immediately gain an authenticated session, bypassing email ownership verification.
**Fix:** Remove the fallback `signInWithPassword()` call. If the sign-up didn't return a session and the project requires email confirmation, always return `{ ok: true, needsEmailConfirmation: true }`. The user should sign in manually after confirming their email.

---

## LOW Findings

### [LOW] L-01: fileUrl Validation Allows URL-Encoded Characters

**Location:**
- `src/app/api/creator/uploads/rush/route.ts:42`
- `src/app/api/creator/uploads/video/route.ts:72-74`

**Issue:** The `fileUrl` validation checks for `!fileUrl.startsWith("/")` and `!fileUrl.includes("..")` but does not check for URL-encoded variants like `%2F` (/) or `%2E%2E` (..). While Supabase Storage likely normalizes these before processing, the lack of explicit decoding and re-checking leaves a theoretical bypass path.
**Risk:** Very low in practice because Supabase Storage processes the key as-is, but defense-in-depth recommends handling encoded characters.
**Fix:** Decode `fileUrl` (using `decodeURIComponent`) before applying path traversal checks, or add checks for `%2e%2e` and `%2f` patterns.

### [LOW] L-02: Payout Profile IBAN Validation is Lenient

**Location:** `src/app/api/creator/payout-profile/route.ts:155`
**Issue:** The route-level validation uses `isLikelyIban()` which checks format but not the IBAN checksum. The use-case layer (`save-creator-payout-profile.ts:8-18`) performs proper mod-97 checksum validation. However, when the user provides an empty IBAN string with method "iban", the route-level check `if (ibanRaw && !isLikelyIban(ibanRaw))` passes because `ibanRaw` is empty (falsy), allowing an IBAN method payout profile to be saved with a null IBAN. The use-case layer then also allows this because it validates `input.iban` which is `null`.
**Risk:** A creator can save a payout profile with method "iban" but no actual IBAN value. This could cause downstream payment processing failures.
**Fix:** When `method === "iban"`, require that `ibanRaw` is non-empty before proceeding.

### [LOW] L-03: Error Messages Expose Internal System Details

**Location:**
- `src/app/api/creator/uploads/video/route.ts:35-36` -- `error.message.startsWith("Rate not found for videoType:")`
- `src/app/api/creator/uploads/video/route.ts:37` -- `error.message.startsWith("Video type is disabled:")`

**Issue:** Several error handling paths in the video upload route expose internal error messages directly to the client via `resolveRecordUploadError()`. Messages like "Rate not found for videoType: X" reveal the internal rate-table structure.
**Risk:** Minor information disclosure that helps an attacker understand the internal data model.
**Fix:** Map all use-case errors to generic user-facing messages. Return the video type in the response for debugging but not internal implementation details like "Rate not found."

### [LOW] L-04: onboarding/options is Fully Public with Long Cache

**Location:** `src/app/api/onboarding/options/route.ts:4-21`
**Issue:** This endpoint has no authentication and returns onboarding configuration data with a 300-second public cache (`s-maxage=300, stale-while-revalidate=600`). While this is intentional (the onboarding page is public), it means the onboarding options (likely country lists, configuration) are cached on CDN edges.
**Risk:** If onboarding options ever include any business-sensitive data (pricing, internal rates), it would be publicly cached. Currently appears to be benign (country/option lists).
**Fix:** Verify that `getOnboardingPageData()` only returns public-safe data. Add a comment documenting that this endpoint is intentionally public.

### [LOW] L-05: auth/me Endpoint Has No Rate Limiting

**Location:** `src/app/api/auth/me/route.ts:12`
**Issue:** The `/api/auth/me` GET endpoint has no rate limiting. It performs session resolution which involves a Supabase `getUser()` call and potentially multiple database queries (application status, creator lookup, contract signature check). An unauthenticated attacker can spam this endpoint to generate load on Supabase.
**Risk:** Amplification attack -- each request generates 1-4 Supabase queries. At scale, this could exhaust Supabase connection pool or rate limits.
**Fix:** Add rate limiting (e.g., 60 requests/minute per IP).

### [LOW] L-06: Signed URL Expiration is 300 Seconds for Preview URLs

**Location:**
- `src/app/api/rushes/preview/route.ts:54` -- `createSignedUrl(fileUrl, 300)`
- `src/app/api/videos/preview/route.ts:54` -- `createSignedUrl(fileUrl, 300)`

**Issue:** Preview signed URLs are valid for 300 seconds (5 minutes). This is reasonable but if the URL is leaked (via browser history, logs, or Referer header from a GET request), it provides a 5-minute window for unauthorized access.
**Risk:** Low -- the 5-minute window is short, but combined with M-05 (fileUrl in query params), the exposure surface is non-trivial.
**Fix:** Consider reducing to 120 seconds (2 minutes) and having the frontend refresh the URL as needed.

---

## INFO Findings

### [INFO] I-01: In-Memory Rate Limiting Fallback Still Present

**Location:** `src/lib/rate-limit.ts:40-64`
**Issue:** The rate limiter now supports Upstash Redis as a production backend (lines 70-112), which is a significant improvement from v1/v2. However, the in-memory fallback is still active when `UPSTASH_REDIS_REST_URL` is not configured. On serverless platforms without Upstash, rate limiting remains ineffective.
**Note:** This is an operational concern, not a code vulnerability. Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in production.

### [INFO] I-02: Rate Limiter Fails Open on Redis Errors

**Location:** `src/lib/rate-limit.ts:107-109`
**Issue:** When Upstash Redis is unreachable, the rate limiter returns `{ count: 0, resetAt }`, effectively allowing the request through. This is the standard "fail-open" pattern for rate limiters (better to serve users than block everyone during a Redis outage), but it means a Redis outage disables all rate limiting.
**Note:** This is an intentional design choice. Document it and set up alerting for Redis connectivity issues.

### [INFO] I-03: Service Role Key Used for All Database Operations

**Location:** `src/application/dependencies.ts:17-20`, `src/infrastructure/supabase/server-client.ts:24-38`
**Issue:** Every `getRepository()` call creates a new Supabase client using the service role key, which bypasses all RLS policies. This is the same architectural concern from v1/v2. Every API route effectively has full database access once auth checks pass.
**Note:** This is a known architectural decision. The mitigation is that every route must call `requireApiRole()` or `requireApiSession()` before any database access. The audit confirms this is done consistently across all creator-facing routes.

### [INFO] I-04: Solid IDOR Prevention in Upload Routes

**Location:**
- `src/app/api/creator/uploads/rush/route.ts:90` -- `payload.fileUrl.startsWith(\`${auth.session.userId}/\`)`
- `src/app/api/creator/uploads/video/route.ts:131` -- same pattern
- `src/app/api/creator/uploads/rush/signed-url/route.ts:106` -- key scoped to `${auth.session.userId}/`
- `src/app/api/creator/uploads/video/signed-url/route.ts:138` -- same pattern

**Note:** Upload routes correctly derive the storage path from `auth.session.userId` and verify that submitted fileUrls are under the user's own prefix. The `resolveUploadTrackingForUser` use case also correctly looks up the creator by `userId` from the session, not from the request body. This is well-implemented IDOR prevention.

### [INFO] I-05: Application Routes Correctly Derive Identity from Session

**Location:**
- `src/app/api/applications/me/route.ts:19,57-59` -- uses `auth.session.userId` and `auth.session.email`
- `src/app/api/applications/draft/route.ts:21,63` -- uses `auth.session.userId`
- `src/app/api/contract/sign/route.ts:119,147-148` -- uses `auth.session.userId`
- `src/app/api/creator/payout-profile/route.ts:54,179` -- uses `auth.session.userId`

**Note:** All these routes correctly take the user identity from the authenticated session, not from the request body. This eliminates IDOR for these endpoints.

---

## Summary by Severity

| Severity | Count | Fixed from v2 |
|----------|-------|---------------|
| CRITICAL | 0 | user_metadata.role fallback removed |
| HIGH | 4 | isAllowedOrigin() no longer allows missing Origin by default |
| MEDIUM | 8 | Upstash Redis rate limiting added |
| LOW | 6 | -- |
| INFO | 5 | -- |

## Top 3 Recommendations (Priority Order)

1. **Add rate limiting to all unprotected endpoints** (H-03): `applications/draft` PUT/DELETE, `applications/me` GET/POST, `auth/me` GET, `auth/sign-out` POST. These are the easiest wins.

2. **Restrict upload file types** (H-04): Add extension/MIME type allowlists to signed upload URL generation. This prevents stored XSS via uploaded HTML/SVG files.

3. **Remove the sign-up auto-sign-in fallback** (M-08): The `signInWithPassword` fallback after sign-up can bypass email confirmation. Remove it to enforce the intended email verification flow.
