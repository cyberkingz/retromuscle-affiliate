import { NextResponse } from "next/server";

import { readBearerToken, resolveAuthSessionFromAccessToken } from "@/features/auth/server/resolve-auth-session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";

export async function POST(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let session: Awaited<ReturnType<typeof resolveAuthSessionFromAccessToken>>;
  try {
    session = await resolveAuthSessionFromAccessToken(token);
  } catch {
    return NextResponse.json({ message: "Unable to resolve auth session" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "affiliate") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const client = createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("creators")
    .update({ contract_signed_at: now })
    .eq("user_id", session.userId)
    .select("id, contract_signed_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: "Unable to sign contract" }, { status: 500 });
  }

  if (!data?.id) {
    return NextResponse.json({ message: "Creator not found" }, { status: 404 });
  }

  return NextResponse.json({ creatorId: data.id, contractSignedAt: data.contract_signed_at }, { status: 200 });
}

