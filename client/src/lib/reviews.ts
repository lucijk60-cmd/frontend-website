type LocalizedReview = {
  review: string;
  reviewAr?: string | null;
};

export function getLocalizedReviewText(review: LocalizedReview, language: "en" | "ar") {
  return language === "ar" ? review.reviewAr?.trim() || review.review : review.review;
}
