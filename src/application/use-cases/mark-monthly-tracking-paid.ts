import { getRepository } from "@/application/dependencies";

export async function markMonthlyTrackingPaid(input: { monthlyTrackingId: string; paidAt?: string | null }) {
  const repository = getRepository();

  // Guard: fetch tracking to get creatorId
  const tracking = await repository.getMonthlyTrackingById(input.monthlyTrackingId);
  if (!tracking) {
    throw new Error("Impossible: suivi mensuel introuvable.");
  }

  // Guard: verify creator has a valid payout profile
  const profile = await repository.getPayoutProfileByCreatorId(tracking.creatorId);
  if (!profile) {
    throw new Error("Impossible: ce createur n'a pas configure son profil de paiement.");
  }

  if (profile.method === "iban" && !profile.iban) {
    throw new Error("Impossible: le profil de paiement IBAN est incomplet (IBAN manquant).");
  }
  if (profile.method === "paypal" && !profile.paypalEmail) {
    throw new Error("Impossible: le profil de paiement PayPal est incomplet (email manquant).");
  }
  if (profile.method === "stripe" && !profile.stripeAccount) {
    throw new Error("Impossible: le profil de paiement Stripe est incomplet (compte manquant).");
  }

  return repository.markMonthlyTrackingPaid({
    monthlyTrackingId: input.monthlyTrackingId,
    paidAt: input.paidAt ?? null
  });
}
