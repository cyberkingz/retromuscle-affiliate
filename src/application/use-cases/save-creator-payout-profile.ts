import { getRepository } from "@/application/dependencies";
import type { CreatorPayoutProfile } from "@/domain/types";

const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate IBAN checksum using ISO 13616 mod-97 algorithm. */
function isValidIbanChecksum(iban: string): boolean {
  // Move first 4 chars to end, replace letters with 2-digit numbers (A=10..Z=35)
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  // Compute mod 97 using chunked arithmetic to avoid BigInt
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + Number(numeric[i])) % 97;
  }
  return remainder === 1;
}

function validatePayoutFields(input: {
  method: CreatorPayoutProfile["method"];
  iban?: string | null;
  paypalEmail?: string | null;
}): void {
  switch (input.method) {
    case "iban": {
      const iban = input.iban?.replace(/\s/g, "").toUpperCase();
      if (!iban || !IBAN_REGEX.test(iban) || iban.length < 15 || iban.length > 34) {
        throw new Error("IBAN invalide. Format attendu: FR76 XXXX XXXX XXXX XXXX XXXX XXX.");
      }
      if (!isValidIbanChecksum(iban)) {
        throw new Error("IBAN invalide: la cle de controle est incorrecte.");
      }
      break;
    }
    case "paypal": {
      if (!input.paypalEmail || !EMAIL_REGEX.test(input.paypalEmail)) {
        throw new Error("Email PayPal invalide.");
      }
      break;
    }
  }
}

export async function saveCreatorPayoutProfile(input: {
  userId: string;
  method: CreatorPayoutProfile["method"];
  accountHolderName?: string | null;
  iban?: string | null;
  paypalEmail?: string | null;
}): Promise<CreatorPayoutProfile> {
  validatePayoutFields(input);

  const repository = getRepository();
  const creator = await repository.getCreatorByUserId(input.userId);
  if (!creator) {
    throw new Error("Creator not found");
  }

  return repository.upsertPayoutProfile({
    creatorId: creator.id,
    method: input.method,
    accountHolderName: input.accountHolderName ?? null,
    iban: input.method === "iban" ? (input.iban?.replace(/\s/g, "").toUpperCase() ?? null) : null,
    paypalEmail: input.method === "paypal" ? (input.paypalEmail ?? null) : null
  });
}
