import { NextResponse } from "next/server";

import { requireApiSession } from "@/features/auth/server/api-guards";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const limited = rateLimit({ request, key: "auth:redirect-target", limit: 120, windowMs: 60_000 });
  if (limited) {
    limited.headers.set("x-request-id", requestId);
    return limited;
  }

  const auth = await requireApiSession(request, { requestId });
  if (!auth.ok) {
    return auth.response;
  }

  const response = NextResponse.json({ role: auth.session.role, target: auth.session.target });
  response.headers.set("x-request-id", requestId);
  return response;
}
