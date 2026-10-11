import type { Language } from "./siteContent";

type LocalizedReview = {
  review: string;
  reviewAr?: string | null;
};

export function getLocalizedReviewText(review: LocalizedReview, language: Language) {
  return language === "ar" ? review.reviewAr?.trim() || review.review : review.review;
}

export function normalizeReviewReference(value: string) {
  const normalized = value.trim().toUpperCase();
  return /^PPF-[A-Z0-9]{12}$/.test(normalized) ? normalized : "";
}

const SUBMISSION_NOTICES: Record<Language, string> = {
  en: "Saved successfully. Your review is awaiting approval before publication.",
  ar: "تم حفظ مراجعتك بنجاح، وهي بانتظار الموافقة قبل نشرها.",
  bn: "সফলভাবে সংরক্ষিত হয়েছে। আপনার রিভিউটি প্রকাশের আগে অনুমোদনের অপেক্ষায় রয়েছে।",
  ur: "کامیابی سے محفوظ ہو گیا۔ آپ کا جائزہ اشاعت سے قبل منظوری کا منتظر ہے۔",
  hi: "सफलतापूर्वक सहेजा गया। आपकी समीक्षा प्रकाशन से पहले অনুমোদন की प्रतीक्षा में है।",
  fr: "Enregistré avec succès. Votre avis est en attente d'approbation avant publication.",
};

export function getReviewSubmissionNotice(language: Language) {
  return SUBMISSION_NOTICES[language] ?? SUBMISSION_NOTICES.en;
}

