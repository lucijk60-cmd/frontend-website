import { describe, expect, it } from "vitest";
import { images, USE_EMBEDDED_IMAGES } from "./siteContent";

describe("embedded image mapping", () => {
  it("uses embedded data sources for all active image aliases", () => {
    expect(USE_EMBEDDED_IMAGES).toBe(true);
    for (const source of Object.values(images)) {
      expect(source).toMatch(/^data:image\/(webp|jpeg|png);base64,/);
    }
  });
});
