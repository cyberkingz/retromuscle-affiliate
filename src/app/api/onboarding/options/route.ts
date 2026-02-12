import { getOnboardingPageData } from "@/application/use-cases/get-onboarding-page-data";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  try {
    const data = await getOnboardingPageData();
    return apiJson(ctx, data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    });
  } catch {
    return apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to load onboarding options" });
  }
}
