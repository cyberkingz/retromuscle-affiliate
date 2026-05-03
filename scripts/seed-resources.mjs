/**
 * One-shot script: move existing training PDF to resources/ prefix and seed the DB row.
 * Run once: node scripts/seed-resources.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const OLD_KEY = "COMMENT FILMER UNE VIDEO TRAINING.pdf";
const NEW_KEY = "resources/comment-filmer-une-video-training.pdf";
const BUCKET  = "assets";

async function run() {
  // 1. Download the existing file
  console.log("Downloading:", OLD_KEY);
  const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(OLD_KEY);
  if (dlErr) { console.error("Download failed:", dlErr.message); process.exit(1); }

  // 2. Upload to new path
  console.log("Uploading to:", NEW_KEY);
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(NEW_KEY, blob, {
    contentType: "application/pdf",
    upsert: true
  });
  if (upErr) { console.error("Upload failed:", upErr.message); process.exit(1); }

  // 3. Seed the resources DB row (idempotent: skip if file_key already exists)
  console.log("Seeding resources table...");
  const { data: existing } = await supabase
    .from("resources")
    .select("id")
    .eq("file_key", NEW_KEY)
    .maybeSingle();

  if (existing) {
    console.log("Row already exists, skipping insert.");
  } else {
    const { error: dbErr } = await supabase.from("resources").insert({
      title:           "Comment filmer une vidéo training",
      description:     "Guide complet pour filmer une vidéo de type Training pour RetroMuscle.",
      content_type:    "TRAINING",
      file_key:        NEW_KEY,
      file_name:       "comment-filmer-une-video-training.pdf",
      file_size_bytes: blob.size,
      is_published:    true,
      sort_order:      0
    });
    if (dbErr) { console.error("DB insert failed:", dbErr.message); process.exit(1); }
  }

  // 4. Delete the old file
  console.log("Removing old file:", OLD_KEY);
  const { error: rmErr } = await supabase.storage.from(BUCKET).remove([OLD_KEY]);
  if (rmErr) console.warn("Could not remove old file (non-fatal):", rmErr.message);

  console.log("Done. Training guide is live.");
}

run();
