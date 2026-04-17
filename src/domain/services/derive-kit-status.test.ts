import { describe, expect, it } from "vitest";

import { deriveKitStatus } from "./derive-kit-status";

describe("deriveKitStatus", () => {
  const NOW = new Date("2026-04-17T12:00:00Z");

  it("returns not_applicable when no contract signed", () => {
    expect(deriveKitStatus({}, NOW)).toBe("not_applicable");
  });

  it("returns pending_code when contract freshly signed but no code yet", () => {
    expect(
      deriveKitStatus(
        {
          contractSignedAt: "2026-04-17T11:58:00Z"
        },
        NOW
      )
    ).toBe("pending_code");
  });

  it("returns failed when contract signed > 5 min ago but no code", () => {
    expect(
      deriveKitStatus(
        {
          contractSignedAt: "2026-04-17T11:00:00Z"
        },
        NOW
      )
    ).toBe("failed");
  });

  it("returns code_ready when code is set and no order yet", () => {
    expect(
      deriveKitStatus(
        {
          contractSignedAt: "2026-04-17T11:00:00Z",
          kitPromoCode: "RETRO-COCOLABAN"
        },
        NOW
      )
    ).toBe("code_ready");
  });

  it("returns ordered when kitOrderPlacedAt is set (takes priority)", () => {
    expect(
      deriveKitStatus(
        {
          contractSignedAt: "2026-04-17T11:00:00Z",
          kitPromoCode: "RETRO-COCOLABAN",
          kitOrderPlacedAt: "2026-04-17T11:30:00Z"
        },
        NOW
      )
    ).toBe("ordered");
  });

  it("handles malformed contractSignedAt gracefully", () => {
    expect(
      deriveKitStatus(
        {
          contractSignedAt: "not-a-date"
        },
        NOW
      )
    ).toBe("failed");
  });
});
