/**
 * User-provided Arabic review copy.
 *
 * These entries are intentionally anonymous and pending verification. They must
 * not be presented as approved customer testimonials until the owner verifies
 * the source and approves them in the moderation panel.
 */
export const userProvidedArabicReviews = [
  "خدمة ممتازة جدًا، والتعامل كان احترافيًا من البداية إلى النهاية.",
  "تجربة رائعة، جودة العمل ممتازة والنتيجة كانت أفضل مما توقعت.",
  "فريق محترف وسريع في الرد، وأنصح بالتعامل معهم.",
  "خدمة حماية الطلاء ممتازة، والسيارة أصبحت تبدو أجمل بكثير.",
  "تعامل راقٍ وجودة عالية، بالتأكيد سأعود مرة أخرى.",
  "من أفضل الخدمات التي جربتها لسيارتي، شغل نظيف ومرتب.",
  "الأسعار مناسبة مقارنة بجودة الخدمة، والتعامل ممتاز.",
  "خدمة احترافية واهتمام كبير بالتفاصيل، تجربة ممتازة.",
  "سعيد جدًا بالنتيجة النهائية، أنصح بهم لكل من يهتم بسيارته.",
  "سرعة في التواصل وخدمة ممتازة، شكرًا لكم.",
  "جودة العمل واضحة والنتيجة جميلة جدًا، تجربة تستحق التكرار.",
  "فريق متعاون ومحترم، وتم تنفيذ العمل بشكل ممتاز.",
  "إذا كنت تبحث عن حماية ممتازة لسيارتك، أنصح بتجربتهم.",
  "الخدمة كانت ممتازة من الحجز حتى الانتهاء، تجربة مريحة جدًا.",
  "اهتمام بالتفاصيل وشغل احترافي، السيارة ظهرت بشكل رائع.",
  "تجربة ممتازة وخدمة موثوقة، بالتأكيد أوصي بهم.",
  "التواصل كان سريعًا وواضحًا، وجودة الخدمة ممتازة.",
  "عمل نظيف واحترافي جدًا، وأنا راضٍ تمامًا عن النتيجة.",
  "خدمة رائعة وفريق محترف، أتمنى لهم المزيد من النجاح.",
  "تجربة جميلة جدًا، جودة ممتازة وتعامل محترم، أنصح بهم بشدة.",
] as const;

export const USER_PROVIDED_REVIEW_IMPORT_PREFIX = "PPF-AR";

export function buildUserProvidedArabicReviewEntries() {
  return userProvidedArabicReviews.map((text, index) => ({
    publicReference: `${USER_PROVIDED_REVIEW_IMPORT_PREFIX}${String(index + 1).padStart(10, "0")}`,
    name: "Anonymous",
    rating: 5,
    review: text,
    reviewAr: text,
    status: "pending" as const,
  }));
}
