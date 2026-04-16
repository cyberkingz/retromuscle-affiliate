import { getRepository } from "@/application/dependencies";
import { calculatePayout } from "@/domain/services/calculate-payout";

export async function markMonthlyTrackingPaid(input: {
  monthlyTrackingId: string;
  paidAt?: string | null;
}) {
  const repository = getRepository();

  const tracking = await repository.getMonthlyTrackingById(input.monthlyTrackingId);
  if (!tracking) {
    throw new Error("Impossible: suivi mensuel introuvable.");
  }

  // Idempotency guard: if already paid, return the existing tracking unchanged.
  if (tracking.paymentStatus === "paye") {
    return tracking;
  }

  // Guard: verify creator has a valid payout profile
  const profile = await repository.getPayoutProfileByCreatorId(tracking.creatorId);
  if (!profile) {
    throw new Error("Impossible: ce créateur n'a pas configure son profil de paiement.");
  }

  if (profile.method === "iban" && !profile.iban) {
    throw new Error("Impossible: le profil de paiement IBAN est incomplet (IBAN manquant).");
  }
  if (profile.method === "paypal" && !profile.paypalEmail) {
    throw new Error("Impossible: le profil de paiement PayPal est incomplet (email manquant).");
  }

  // Freeze the payout amount at mark-paid time using current rates.
  const rates = await repository.listRates();
  const payout = calculatePayout(tracking.delivered, rates);

  return repository.markMonthlyTrackingPaid({
    monthlyTrackingId: input.monthlyTrackingId,
    paidAt: input.paidAt ?? null,
    paidAmount: payout.total
  });
}
