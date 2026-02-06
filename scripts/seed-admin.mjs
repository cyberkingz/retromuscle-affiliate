import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const text = fs.readFileSync(envPath, "utf8");
  const result = {};

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!key) continue;

    // Do not override existing process.env values.
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }

    result[key] = value;
  }

  return result;
}

async function findUserByEmail(adminApi, email) {
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await adminApi.listUsers({ page, perPage: 200 });
    if (error) {
      throw error;
    }

    const match = data.users.find((user) => (user.email ?? "").toLowerCase() === normalizedEmail);
    if (match) {
      return match;
    }

    // Pagination ends when less than perPage results are returned.
    if (!data.users.length || data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

async function main() {
  loadDotEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.ADMIN_EMAIL ?? "admin@retromuscle.net";
  const password = process.env.ADMIN_PASSWORD;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!password) {
    throw new Error("Missing ADMIN_PASSWORD (set it for this one-time seed)");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const existing = await findUserByEmail(supabase.auth.admin, email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: {
        ...(existing.app_metadata ?? {}),
        role: "admin"
      }
    });
    if (error) {
      throw error;
    }

    console.log(`Admin user updated: ${data.user?.id ?? existing.id} (${email})`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" }
  });

  if (error) {
    throw error;
  }

  console.log(`Admin user created: ${data.user?.id ?? "unknown"} (${email})`);
}

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exitCode = 1;
});
