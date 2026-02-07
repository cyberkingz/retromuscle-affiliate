import { getOnboardingPageData } from "@/application/use-cases/get-onboarding-page-data";
import { apiJson, createApiContext } from "@/lib/api-response";

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const data = await getOnboardingPageData();
  return apiJson(ctx, data, { status: 200 });
}
