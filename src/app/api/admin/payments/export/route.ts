import { NextResponse } from "next/server";

import { getAdminPaymentsExportData } from "@/application/use-cases/get-admin-payments-export-data";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, createApiContext, finalizeResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { parseMonthParam } from "@/lib/validation";

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[\",\n\r]/.test(text)) {
    return `"${text.replace(/\"/g, "\"\"")}"`;
  }
  return text;
}

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const limited = rateLimit({ ctx, request, key: "admin:payments:export", limit: 30, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let month: string | undefined;
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("month");
    month = raw ? parseMonthParam(raw) : undefined;
  } catch {
    month = undefined;
  }

  try {
    const exportData = await getAdminPaymentsExportData({ month });

    const headers = [
      "month",
      "creator_handle",
      "creator_email",
      "amount",
      "payment_status",
      "paid_at",
      "payout_method",
      "account_holder_name",
      "iban",
      "paypal_email",
      "stripe_account",
      "monthly_tracking_id",
      "creator_id"
    ];

    const lines = [headers.join(",")];
    for (const row of exportData.rows) {
      lines.push(
        [
          row.month,
          row.creatorHandle,
          row.creatorEmail,
          row.amount,
          row.paymentStatus,
          row.paidAt ?? "",
          row.payoutMethod ?? "",
          row.accountHolderName ?? "",
          row.iban ?? "",
          row.paypalEmail ?? "",
          row.stripeAccount ?? "",
          row.monthlyTrackingId,
          row.creatorId
        ].map(csvEscape).join(",")
      );
    }

    const csv = lines.join("\n") + "\n";
    const filename = `retromuscle-payments-${exportData.month}.csv`;

    const response = new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=\"${filename}\"`
      }
    });

    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return finalizeResponse(ctx, response, { rows: exportData.rows.length });
  } catch {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to export payments" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}

