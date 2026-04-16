export type RedirectTarget =
  | "/admin"
  | "/dashboard"
  | "/contract"
  | "/onboarding"
  | "/onboarding/approved";

// "affiliate" = creators/applicants (non-admin).
export type AuthRole = "admin" | "affiliate";
