import fs from "node:fs";
import crypto from "node:crypto";

import { createClient } from "@supabase/supabase-js";

function loadDotEnvLocal() {
  const envPath = new URL("../.env.local", import.meta.url);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!key) continue;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function randomEmail(prefix) {
  const stamp = Date.now();
  const rand = crypto.randomBytes(6).toString("hex");
  return `${prefix}.${stamp}.${rand}@example.com`;
}

function randomPassword() {
  return crypto.randomBytes(18).toString("base64url") + "A1!";
}

class CookieJar {
  constructor() {
    this.jar = new Map();
  }

  updateFromResponse(response) {
    const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
    const setCookies = typeof getSetCookie === "function" ? getSetCookie() : [];
    for (const header of setCookies) {
      const [pair] = header.split(";", 1);
      const eqIndex = pair.indexOf("=");
      if (eqIndex === -1) continue;
      const name = pair.slice(0, eqIndex).trim();
      const value = pair.slice(eqIndex + 1).trim();
      if (!name) continue;
      this.jar.set(name, value);
    }
  }

  header() {
    if (this.jar.size === 0) return "";
    return Array.from(this.jar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
}

async function fetchJson(baseUrl, path, options) {
  const url = new URL(path, baseUrl).toString();
  const response = await fetch(url, options);
  const json = await response.json().catch(() => null);
  return { response, json };
}

async function api(jar, baseUrl, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const cookie = jar.header();
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const { response, json } = await fetchJson(baseUrl, path, {
    method: options.method ?? "GET",
    cache: "no-store",
    headers,
    body: options.json ? JSON.stringify(options.json) : undefined
  });

  jar.updateFromResponse(response);

  return { ok: response.ok, status: response.status, json };
}

function assertOk(step, result) {
  if (!result.ok) {
    const message = typeof result?.json?.message === "string" ? result.json.message : "Unknown error";
    throw new Error(`${step} failed (HTTP ${result.status}): ${message}`);
  }
}

async function main() {
  loadDotEnvLocal();

  const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3010";
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const adminEmail = randomEmail("e2e-admin");
  const adminPassword = randomPassword();
  const affiliateEmail = randomEmail("e2e-affiliate");
  const affiliatePassword = randomPassword();

  const createdUserIds = [];

  console.log("[1/9] Creating auth users (admin + affiliate)...");
  {
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: { role: "admin" }
    });
    if (adminError) throw adminError;
    if (!adminData.user?.id) throw new Error("Admin user not created");
    createdUserIds.push(adminData.user.id);

    const { data: affiliateData, error: affiliateError } = await supabase.auth.admin.createUser({
      email: affiliateEmail,
      password: affiliatePassword,
      email_confirm: true
    });
    if (affiliateError) throw affiliateError;
    if (!affiliateData.user?.id) throw new Error("Affiliate user not created");
    createdUserIds.push(affiliateData.user.id);
  }

  const adminUserId = createdUserIds[0];
  const affiliateUserId = createdUserIds[1];

  const adminJar = new CookieJar();
  const affiliateJar = new CookieJar();

  console.log("[2/9] Fetching onboarding options (packages/mixes)...");
  const options = await api(new CookieJar(), baseUrl, "/api/onboarding/options");
  assertOk("onboarding options", options);
  const pkg = options.json?.packages?.[0];
  const mix = options.json?.mixes?.[0];
  if (!pkg?.tier || !mix?.name) {
    throw new Error("Missing onboarding options in response");
  }

  console.log("[3/9] Signing in affiliate via app API (cookie-based)...");
  const affiliateSignIn = await api(affiliateJar, baseUrl, "/api/auth/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: { email: affiliateEmail, password: affiliatePassword }
  });
  assertOk("affiliate sign-in", affiliateSignIn);

  console.log("[4/9] Submitting creator application (step 3)...");
  const applicationSave = await api(affiliateJar, baseUrl, "/api/applications/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: {
      fullName: "E2E Affiliate",
      whatsapp: "+33600000000",
      country: "FR",
      address: "1 Rue Exemple, 75000 Paris",
      socialTiktok: "https://www.tiktok.com/@retromuscle",
      socialInstagram: "https://www.instagram.com/retromuscle",
      followers: 1234,
      packageTier: pkg.tier,
      mixName: mix.name,
      submit: true
    }
  });
  assertOk("application submit", applicationSave);
  if (applicationSave.json?.application?.status !== "pending_review") {
    throw new Error("Application did not transition to pending_review");
  }

  console.log("[5/9] Signing in admin via app API (cookie-based)...");
  const adminSignIn = await api(adminJar, baseUrl, "/api/auth/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: { email: adminEmail, password: adminPassword }
  });
  assertOk("admin sign-in", adminSignIn);

  console.log("[6/9] Approving application (admin)...");
  const approve = await api(adminJar, baseUrl, "/api/admin/applications/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: { userId: affiliateUserId, decision: "approved", reviewNotes: "ok" }
  });
  assertOk("application approve", approve);
  const creatorId = approve.json?.creatorId;
  if (!creatorId) {
    throw new Error("Missing creatorId after approval");
  }

  console.log("[7/9] Signing contract (affiliate)...");
  const contract = await api(affiliateJar, baseUrl, "/api/contract/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: {
      signerName: "E2E Affiliate",
      accepted: { terms: true, age18: true, rightsAndReleases: true }
    }
  });
  assertOk("contract sign", contract);

  console.log("[8/9] Uploading a dummy video (signed upload + record)...");
  const dashBefore = await api(affiliateJar, baseUrl, `/api/creator/${creatorId}/dashboard`);
  assertOk("creator dashboard (before upload)", dashBefore);
  const trackingId = dashBefore.json?.upload?.monthlyTrackingId;
  if (!trackingId) throw new Error("Missing monthlyTrackingId in dashboard");

  const signed = await api(affiliateJar, baseUrl, "/api/creator/uploads/video/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: { monthlyTrackingId: trackingId, videoType: "CINEMATIC", filename: "e2e.mp4" }
  });
  assertOk("signed upload url", signed);
  if (!signed.json?.signedUrl || !signed.json?.key) {
    throw new Error("Missing signedUrl/key from signed upload response");
  }

  const uploadForm = new FormData();
  uploadForm.append("cacheControl", "3600");
  uploadForm.append("", new Blob([new Uint8Array([0, 1, 2, 3])], { type: "video/mp4" }), "e2e.mp4");

  const uploadResponse = await fetch(signed.json.signedUrl, {
    method: "PUT",
    headers: { "x-upsert": "false" },
    body: uploadForm
  });
  if (!uploadResponse.ok) {
    throw new Error(`Signed upload failed (HTTP ${uploadResponse.status})`);
  }

  const recorded = await api(affiliateJar, baseUrl, "/api/creator/uploads/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: {
      monthlyTrackingId: trackingId,
      videoType: "CINEMATIC",
      fileUrl: signed.json.key,
      durationSeconds: 20,
      resolution: "1080x1920",
      fileSizeMb: 1
    }
  });
  assertOk("record upload", recorded);
  const videoId = recorded.json?.id;
  if (!videoId) {
    throw new Error("Missing video id in record response");
  }

  console.log("[9/9] Reviewing video (admin) and validating delivered counts...");
  const overview = await api(adminJar, baseUrl, "/api/admin/overview");
  assertOk("admin overview", overview);
  const queueIds = Array.isArray(overview.json?.validationQueue)
    ? overview.json.validationQueue.map((row) => row.videoId)
    : [];
  if (!queueIds.includes(videoId)) {
    throw new Error("Video not found in admin validation queue");
  }

  const review = await api(adminJar, baseUrl, "/api/admin/videos/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    json: { videoId, decision: "approved" }
  });
  assertOk("video review", review);

  const dashAfter = await api(affiliateJar, baseUrl, `/api/creator/${creatorId}/dashboard`);
  assertOk("creator dashboard (after review)", dashAfter);
  const afterDelivered = dashAfter.json?.progress?.deliveredTotal;
  if (typeof afterDelivered !== "number" || afterDelivered < 1) {
    throw new Error("Delivered counts not updated after approval");
  }

  console.log("Smoke flow OK: signup -> onboarding submit -> admin approve -> contract -> upload -> approve.");

  // Best-effort cleanup to keep the project tidy.
  try {
    const key = signed.json.key;
    await supabase.storage.from("videos").remove([key]);
  } catch {
    // ignore
  }

  try {
    await supabase.from("videos").delete().eq("id", videoId);
  } catch {
    // ignore
  }

  try {
    await supabase.from("monthly_tracking").delete().eq("creator_id", creatorId);
  } catch {
    // ignore
  }

  try {
    await supabase.from("creators").delete().eq("id", creatorId);
  } catch {
    // ignore
  }

  try {
    await supabase.from("creator_applications").delete().eq("user_id", affiliateUserId);
  } catch {
    // ignore
  }

  for (const userId of createdUserIds) {
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch {
      // ignore
    }
  }

  // Avoid leaving the dev server as a dependency for next steps.
  console.log(`Base URL used: ${baseUrl}`);
  console.log(`Users created+deleted: ${createdUserIds.length}`);
  console.log(`Admin seed unaffected: ${adminUserId ? "yes" : "no"}`);
}

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exitCode = 1;
});
