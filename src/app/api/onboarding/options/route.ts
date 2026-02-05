import { NextResponse } from "next/server";

import { getOnboardingPageData } from "@/application/use-cases/get-onboarding-page-data";

export async function GET() {
  const data = await getOnboardingPageData();
  return NextResponse.json(data);
}
