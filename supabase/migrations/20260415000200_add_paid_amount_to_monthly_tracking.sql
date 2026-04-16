-- S0.6 — Freeze the paid amount at mark-paid time
-- Add paid_amount column to monthly_tracking so the payout figure is immutable
-- once a payment cycle is marked as paid. Without this, retroactive rate changes
-- would silently alter historical payment amounts.

ALTER TABLE monthly_tracking
  ADD COLUMN IF NOT EXISTS paid_amount numeric(10, 2) DEFAULT NULL;

COMMENT ON COLUMN monthly_tracking.paid_amount IS
  'Amount frozen at mark-paid time (calculated from rates active at that moment). NULL until payment_status = ''paye''.';
