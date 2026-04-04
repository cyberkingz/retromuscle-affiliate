// Packages have been removed -- this route is no longer active.
// Kept as empty module to avoid 404 during migration.

import { apiError, createApiContext } from "@/lib/api-response";

export async function PUT(request: Request) {
  const ctx = createApiContext(request);
  return apiError(ctx, { status: 410, code: "NOT_FOUND", message: "Package definitions have been removed" });
}
