export type LocalizedMediaLanguage = "en" | "ar";

export type LocalizedMediaRecord = {
  kind: "image" | "video";
  language: "en" | "ar" | "shared";
  status: "draft" | "published";
};

export function selectPublishedMedia<T extends LocalizedMediaRecord>(
  items: readonly T[],
  language: LocalizedMediaLanguage,
  kind: T["kind"],
) {
  return items.filter(
    item => item.status === "published" && item.kind === kind && (item.language === language || item.language === "shared"),
  );
}
