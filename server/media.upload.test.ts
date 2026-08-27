import { describe, expect, it } from "vitest";
import { MAX_BASE64_UPLOAD_CHARS, validateUpload } from "./routers";

describe("admin media upload validation", () => {
  const base = {
    title: "Full body protection",
    dataBase64: "a".repeat(32),
    publish: true,
    pairKey: "ppfstudio-test-1234",
  };

  it("accepts supported paired image assets under the image limit", () => {
    expect(() => validateUpload({ ...base, kind: "image", language: "en", fileName: "english.webp", mimeType: "image/webp" }, 1024 * 1024)).not.toThrow();
    expect(() => validateUpload({ ...base, kind: "image", language: "ar", fileName: "arabic.webp", mimeType: "image/webp" }, 1024 * 1024)).not.toThrow();
  });

  it("keeps enough encoded payload room for a 50 MB raw video", () => {
    expect(MAX_BASE64_UPLOAD_CHARS).toBeGreaterThanOrEqual(Math.ceil(50 * 1024 * 1024 * 4 / 3));
  });

  it("accepts supported video assets and rejects invalid type or size", () => {
    expect(() => validateUpload({ ...base, kind: "video", language: "en", fileName: "english.mp4", mimeType: "video/mp4" }, 10 * 1024 * 1024)).not.toThrow();
    expect(() => validateUpload({ ...base, kind: "video", language: "ar", fileName: "arabic.txt", mimeType: "text/plain" }, 10)).toThrow();
    expect(() => validateUpload({ ...base, kind: "video", language: "en", fileName: "large.mp4", mimeType: "video/mp4" }, 51 * 1024 * 1024)).toThrow();
  });
});
