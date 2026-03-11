import { describe, expect, it } from "vitest";

import { getApplyPageData } from "@/application/use-cases/get-apply-page-data";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";

describe("getApplyPageData", () => {
  it("returns a marketing object with all expected top-level keys", async () => {
    const data = await getApplyPageData();

    expect(data).toHaveProperty("marketing");
    expect(data.marketing).toHaveProperty("heroImageUrl");
    expect(data.marketing).toHaveProperty("attention");
    expect(data.marketing).toHaveProperty("interestPoints");
    expect(data.marketing).toHaveProperty("socialProof");
    expect(data.marketing).toHaveProperty("desire");
    expect(data.marketing).toHaveProperty("action");
  });

  it("uses BRAND_ASSETS.heroLifestyle for heroImageUrl", async () => {
    const data = await getApplyPageData();

    expect(data.marketing.heroImageUrl).toBe(BRAND_ASSETS.heroLifestyle);
  });

  it("has a non-empty attention section", async () => {
    const data = await getApplyPageData();
    const { attention } = data.marketing;

    expect(attention.badge.length).toBeGreaterThan(0);
    expect(attention.headline.length).toBeGreaterThan(0);
    expect(attention.supportingText.length).toBeGreaterThan(0);
  });

  it("has at least one interest point", async () => {
    const data = await getApplyPageData();

    expect(data.marketing.interestPoints.length).toBeGreaterThanOrEqual(1);
    for (const point of data.marketing.interestPoints) {
      expect(typeof point).toBe("string");
      expect(point.length).toBeGreaterThan(0);
    }
  });

  it("socialProof has stats, creators, and trustedBy arrays", async () => {
    const data = await getApplyPageData();
    const { socialProof } = data.marketing;

    expect(Array.isArray(socialProof.stats)).toBe(true);
    expect(Array.isArray(socialProof.creators)).toBe(true);
    expect(Array.isArray(socialProof.trustedBy)).toBe(true);
  });

  it("each stat has a label and value", async () => {
    const data = await getApplyPageData();

    for (const stat of data.marketing.socialProof.stats) {
      expect(stat).toHaveProperty("label");
      expect(stat).toHaveProperty("value");
      expect(stat.label.length).toBeGreaterThan(0);
      expect(stat.value.length).toBeGreaterThan(0);
    }
  });

  it("desire section has a title and non-empty bullets", async () => {
    const data = await getApplyPageData();
    const { desire } = data.marketing;

    expect(desire.title.length).toBeGreaterThan(0);
    expect(desire.bullets.length).toBeGreaterThanOrEqual(1);
    for (const bullet of desire.bullets) {
      expect(bullet.length).toBeGreaterThan(0);
    }
  });

  it("action section has urgencyText and reassurance", async () => {
    const data = await getApplyPageData();
    const { action } = data.marketing;

    expect(action.urgencyText.length).toBeGreaterThan(0);
    expect(action.reassurance.length).toBeGreaterThan(0);
  });

  it("returns consistent data across multiple calls", async () => {
    const first = await getApplyPageData();
    const second = await getApplyPageData();

    expect(first).toEqual(second);
  });
});
