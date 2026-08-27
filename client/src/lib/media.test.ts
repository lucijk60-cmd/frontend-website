import { describe, expect, it } from "vitest";
import { selectPublishedMedia } from "./media";

const media = [
  { id: 1, kind: "image" as const, language: "en" as const, status: "published" as const, pairKey: "pair-1" },
  { id: 2, kind: "image" as const, language: "ar" as const, status: "published" as const, pairKey: "pair-1" },
  { id: 3, kind: "image" as const, language: "en" as const, status: "draft" as const, pairKey: "pair-2" },
  { id: 4, kind: "video" as const, language: "shared" as const, status: "published" as const, pairKey: null },
];

describe("selectPublishedMedia", () => {
  it("returns only published assets for the active language and preserves the pair", () => {
    expect(selectPublishedMedia(media, "en", "image").map(item => item.id)).toEqual([1]);
    expect(selectPublishedMedia(media, "ar", "image").map(item => item.id)).toEqual([2]);
  });

  it("includes shared published media only for the requested kind", () => {
    expect(selectPublishedMedia(media, "ar", "video").map(item => item.id)).toEqual([4]);
    expect(selectPublishedMedia(media, "en", "image").every(item => item.status === "published")).toBe(true);
  });
});
