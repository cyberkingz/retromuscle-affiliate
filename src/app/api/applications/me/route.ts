import { NextResponse } from "next/server";

import { badRequest, parsePayload, requireUserFromRequest, unauthorized } from "@/app/api/applications/_lib";

export async function GET(request: Request) {
  try {
    const { client, userId } = await requireUserFromRequest(request);

    const { data, error } = await client
      .from("creator_applications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: data ?? null });
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : "Unauthorized");
  }
}

export async function POST(request: Request) {
  let userId: string;
  let authEmail: string | undefined;
  let client: Awaited<ReturnType<typeof requireUserFromRequest>>["client"];

  try {
    const auth = await requireUserFromRequest(request);
    userId = auth.userId;
    authEmail = auth.email;
    client = auth.client;
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : "Unauthorized");
  }

  let payload;
  try {
    payload = parsePayload(await request.json());
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid payload");
  }

  const nowIso = new Date().toISOString();

  const row = {
    user_id: userId,
    handle: payload.handle,
    full_name: payload.fullName,
    email: authEmail ?? payload.email,
    whatsapp: payload.whatsapp,
    country: payload.country,
    address: payload.address,
    social_tiktok: payload.socialTiktok ?? null,
    social_instagram: payload.socialInstagram ?? null,
    followers: payload.followers,
    portfolio_url: payload.portfolioUrl ?? null,
    package_tier: payload.packageTier,
    mix_name: payload.mixName,
    status: payload.submit ? "pending_review" : "draft",
    submitted_at: payload.submit ? nowIso : null
  };

  const { data, error } = await client
    .from("creator_applications")
    .upsert(row, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data }, { status: 200 });
}
