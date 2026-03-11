import { describe, expect, it } from "vitest";

import { cn } from "@/lib/cn";

describe("cn", () => {
  it("merges multiple class strings", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("handles conditional classes via objects", () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn("base", { "bg-blue-500": isActive, "opacity-50": isDisabled });
    expect(result).toContain("base");
    expect(result).toContain("bg-blue-500");
    expect(result).not.toContain("opacity-50");
  });

  it("removes duplicate Tailwind classes via tailwind-merge", () => {
    // tailwind-merge should resolve conflicts: later class wins
    const result = cn("px-4", "px-6");
    expect(result).toBe("px-6");
  });

  it("resolves conflicting Tailwind color classes", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(undefined)).toBe("");
    expect(cn(null)).toBe("");
  });

  it("handles arrays of classes", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("handles a mix of strings, objects, and arrays", () => {
    const result = cn("base", ["flex", "items-center"], { "gap-2": true, hidden: false });
    expect(result).toContain("base");
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).toContain("gap-2");
    expect(result).not.toContain("hidden");
  });

  it("resolves padding conflicts correctly", () => {
    // p-4 sets all padding; px-2 overrides horizontal padding
    const result = cn("p-4", "px-2");
    expect(result).toContain("px-2");
  });

  it("preserves non-Tailwind classes", () => {
    const result = cn("custom-class", "another-class", "text-sm");
    expect(result).toContain("custom-class");
    expect(result).toContain("another-class");
    expect(result).toContain("text-sm");
  });
});
