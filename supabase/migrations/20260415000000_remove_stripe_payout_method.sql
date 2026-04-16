-- S0.1 — Remove Stripe as a payout method
-- Stripe is no longer supported. Drop the stripe_account column and tighten the
-- CHECK constraint so only 'iban' and 'paypal' are accepted going forward.

-- 1. Clear any existing Stripe payout profiles (set method to 'paypal' as a safe
--    fallback, nulling the stripe_account value so data remains consistent).
UPDATE creator_payout_profiles
SET method = 'paypal',
    stripe_account = NULL
WHERE method = 'stripe';

-- 2. Drop the stripe_account column.
ALTER TABLE creator_payout_profiles
  DROP COLUMN IF EXISTS stripe_account;

-- 3. Replace the CHECK constraint that allowed 'stripe'.
ALTER TABLE creator_payout_profiles
  DROP CONSTRAINT IF EXISTS creator_payout_profiles_method_check;

ALTER TABLE creator_payout_profiles
  ADD CONSTRAINT creator_payout_profiles_method_check
    CHECK (method IN ('iban', 'paypal'));
