import { describe, expect, it } from "vitest";
import { getLocalizedReviewText } from "./reviews";

describe("getLocalizedReviewText", () => {
  const review = {
    review: "Smooth experience and professional service. Highly recommended.",
    reviewAr: "تجربة سلسة وخدمة احترافية. أوصي بها بشدة.",
  };

  it("returns the English review in English mode", () => {
    expect(getLocalizedReviewText(review, "en")).toBe(review.review);
  });

  it("returns the paired Arabic translation in Arabic mode", () => {
    expect(getLocalizedReviewText(review, "ar")).toBe(review.reviewAr);
  });

  it("falls back to English when Arabic text is unavailable", () => {
    expect(getLocalizedReviewText({ review: review.review, reviewAr: "  " }, "ar")).toBe(review.review);
  });
});
