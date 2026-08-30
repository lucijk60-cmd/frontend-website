import { describe, expect, it } from "vitest";
import { buildUserProvidedArabicReviewEntries, userProvidedArabicReviews } from "./userProvidedArabicReviews";

describe("user-provided Arabic review import data", () => {
  it("contains exactly the 20 supplied Arabic texts", () => {
    expect(userProvidedArabicReviews).toHaveLength(20);
    expect(new Set(userProvidedArabicReviews).size).toBe(20);
  });

  it("keeps imported rows anonymous and pending for moderation", () => {
    const entries = buildUserProvidedArabicReviewEntries();
    expect(entries).toHaveLength(20);
    expect(entries.every(entry => entry.name === "Anonymous")).toBe(true);
    expect(entries.every(entry => entry.status === "pending")).toBe(true);
    expect(entries.every(entry => entry.rating === 5)).toBe(true);
    expect(entries.every(entry => entry.review === entry.reviewAr)).toBe(true);
    expect(new Set(entries.map(entry => entry.publicReference)).size).toBe(20);
  });
});
