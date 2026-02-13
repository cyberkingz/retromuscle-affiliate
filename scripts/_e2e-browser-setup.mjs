import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const text = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of text.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  const value = t.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const emails = ["e2e-browser-admin@example.com", "e2e-browser-creator@example.com"];

// Cleanup leftovers
const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 500 });
for (const u of (listData?.users || [])) {
  if (emails.includes(u.email)) {
    const { data: creators } = await supabase.from("creators").select("id").eq("user_id", u.id);
    for (const c of (creators || [])) {
      await supabase.from("creator_payout_profiles").delete().eq("creator_id", c.id);
      await supabase.from("videos").delete().eq("creator_id", c.id);
      await supabase.from("monthly_tracking").delete().eq("creator_id", c.id);
      await supabase.from("creators").delete().eq("id", c.id);
    }
    await supabase.from("creator_applications").delete().eq("user_id", u.id);
    await supabase.auth.admin.deleteUser(u.id);
    console.log("Cleaned:", u.email);
  }
}

// Create admin
const { data: admin, error: ae } = await supabase.auth.admin.createUser({
  email: "e2e-browser-admin@example.com",
  password: "BrowserTest2026!",
  email_confirm: true,
  app_metadata: { role: "admin" }
});
if (ae) throw ae;
console.log("Admin:", admin.user.id);

// Create affiliate
const { data: aff, error: afe } = await supabase.auth.admin.createUser({
  email: "e2e-browser-creator@example.com",
  password: "BrowserTest2026!",
  email_confirm: true
});
if (afe) throw afe;
console.log("Affiliate:", aff.user.id);
console.log("READY");
