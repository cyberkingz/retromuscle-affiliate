import { NextResponse } from "next/server";

import { requireApiRole } from "@/features/auth/server/api-guards";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";

export async function POST(request: Request) {
  const auth = await requireApiRole(request, "affiliate");
  if (!auth.ok) {
    return auth.response;
  }

  const client = createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("creators")
    .update({ contract_signed_at: now })
    .eq("user_id", auth.session.userId)
    .select("id, contract_signed_at")
    .maybeSingle();

  if (error) {
    const response = NextResponse.json({ message: "Unable to sign contract" }, { status: 500 });
    response.headers.set("x-request-id", auth.requestId);
    return response;
  }

  if (!data?.id) {
    const response = NextResponse.json({ message: "Creator not found" }, { status: 404 });
    response.headers.set("x-request-id", auth.requestId);
    return response;
  }

  const response = NextResponse.json(
    { creatorId: data.id, contractSignedAt: data.contract_signed_at },
    { status: 200 }
  );
  response.headers.set("x-request-id", auth.requestId);
  return response;
}
