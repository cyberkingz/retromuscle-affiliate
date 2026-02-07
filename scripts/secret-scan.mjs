#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const scanStaged = args.has("--staged");

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
}

function listFiles() {
  if (scanStaged) {
    const output = run("git diff --cached --name-only --diff-filter=ACMRTUXB");
    return output ? output.split("\n").filter(Boolean) : [];
  }

  const output = run("git ls-files");
  return output ? output.split("\n").filter(Boolean) : [];
}

function isProbablyText(buffer) {
  // Heuristic: reject null bytes.
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] === 0) return false;
  }
  return true;
}

const patterns = [
  { name: "supabase_secret_key", regex: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g },
  { name: "supabase_publishable_key", regex: /\bsb_publishable_[A-Za-z0-9_-]{20,}\b/g },
  { name: "supabase_access_token", regex: /\bsbp_[A-Za-z0-9]{20,}\b/g },
  // Generic JWT (three segments). Enforce a minimum length to avoid placeholders.
  { name: "jwt", regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { name: "private_key", regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g },
];

const ignore = [
  ".env.example",
  "package-lock.json",
  "scripts/secret-scan.mjs",
  "supabase/migrations/",
  "docs/",
];

function shouldIgnore(file) {
  return ignore.some((prefix) => file === prefix || file.startsWith(prefix));
}

function findLineNumber(text, index) {
  // 1-based line number
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") line += 1;
  }
  return line;
}

function redact(name, value) {
  if (!value) return "[REDACTED]";
  if (name === "private_key") return "-----BEGIN PRIVATE KEY----- [REDACTED]";

  const trimmed = String(value).trim();
  if (trimmed.length <= 12) return "[REDACTED]";

  // Keep prefix context but avoid leaking the full secret.
  const prefix = trimmed.startsWith("sb_secret_")
    ? "sb_secret_"
    : trimmed.startsWith("sb_publishable_")
      ? "sb_publishable_"
      : trimmed.startsWith("sbp_")
        ? "sbp_"
        : trimmed.startsWith("eyJ")
          ? "jwt:"
          : "";

  const body = trimmed.slice(prefix && prefix !== "jwt:" ? prefix.length : 0);
  const head = body.slice(0, 4);
  const tail = body.slice(-4);
  return `${prefix}${head}…${tail}`;
}

function main() {
  const files = listFiles();
  const findings = [];

  for (const file of files) {
    if (shouldIgnore(file)) continue;
    if (!fs.existsSync(file)) continue;

    let buffer;
    try {
      buffer = fs.readFileSync(file);
    } catch {
      continue;
    }
    if (buffer.length > 1024 * 1024) {
      // Skip huge files.
      continue;
    }
    if (!isProbablyText(buffer)) continue;

    const text = buffer.toString("utf8");

    for (const { name, regex } of patterns) {
      regex.lastIndex = 0;
      const match = regex.exec(text);
      if (!match) continue;

      const index = match.index;
      const line = findLineNumber(text, index);
      const token = match[0];

      findings.push({
        name,
        file,
        line,
        token: redact(name, token)
      });
    }
  }

  if (findings.length === 0) {
    process.stdout.write("secret-scan: OK\n");
    return;
  }

  process.stderr.write("secret-scan: potential secrets detected\n\n");
  for (const f of findings) {
    process.stderr.write(`- ${f.file}:${f.line} (${f.name}) ${f.token}\n`);
  }
  process.stderr.write(
    `\nIf this is a false-positive, adjust scripts/secret-scan.mjs allowlist.\n`
  );
  process.exitCode = 1;
}

main();
