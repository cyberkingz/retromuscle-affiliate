export type BadgeTone = "neutral" | "success" | "warning";

function normalize(value: string): string {
  return value.toLowerCase();
}

export function paymentStatusTone(statusLabel: string): BadgeTone {
  const value = normalize(statusLabel);

  if (value.includes("paye") || value.includes("paid")) {
    return "success";
  }

  if (value.includes("attente") || value.includes("pending") || value.includes("review")) {
    return "warning";
  }

  return "neutral";
}

export function creatorStatusTone(statusLabel: string): BadgeTone {
  const value = normalize(statusLabel);

  if (value.includes("actif") || value.includes("active") || value.includes("approved")) {
    return "success";
  }

  if (value.includes("pending") || value.includes("attente") || value.includes("review")) {
    return "warning";
  }

  return "neutral";
}
