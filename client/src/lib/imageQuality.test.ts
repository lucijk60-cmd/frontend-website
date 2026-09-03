import { describe, expect, it } from "vitest";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("PPFStudio image quality presentation", () => {
  it("keeps active media images centered with native browser rendering", () => {
    for (const selector of [".hero-image", ".gallery-card img", ".comparison-image", ".video-card img", ".quality-image-wrap img", ".closing-image img"]) {
      const start = css.indexOf(`${selector} {`);
      expect(start).toBeGreaterThan(-1);
      const rule = css.slice(start, css.indexOf("}", start) + 1);
      expect(rule).toContain("object-position: center");
      expect(rule).toContain("image-rendering: auto");
    }
  });

  it("does not apply the previous heavy desaturation to primary media", () => {
    expect(css).not.toContain(".video-card img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.7)");
    expect(css).not.toContain(".quality-image-wrap img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.76)");
  });
});
