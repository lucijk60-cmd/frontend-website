type LocalizedReview = {
  review: string;
  reviewAr?: string | null;
};

export function getLocalizedReviewText(review: LocalizedReview, language: "en" | "ar") {
  return language === "ar" ? review.reviewAr?.trim() || review.review : review.review;
}

export function normalizeReviewReference(value: string) {
  const normalized = value.trim().toUpperCase();
  return /^PPF-[A-Z0-9]{12}$/.test(normalized) ? normalized : "";
}

export function getReviewSubmissionNotice(language: "en" | "ar") {
  return language === "ar"
    ? "تم حفظ مراجعتك بنجاح، وهي بانتظار الموافقة قبل نشرها."
    : "Saved successfully. Your review is awaiting approval before publication.";
}
