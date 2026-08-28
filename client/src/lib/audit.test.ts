import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { selectVideoSource } from "./media";
import { images } from "./siteContent";

describe("full website audit regressions", () => {
  it("uses the uploaded video URL instead of the static demo source", () => {
    expect(selectVideoSource({ src: "/manus-storage/admin-media/video/en/file.mp4", isUploaded: true }, "demo.mp4")).toBe("/manus-storage/admin-media/video/en/file.mp4");
    expect(selectVideoSource({ src: "/poster.webp", isUploaded: false }, "demo.mp4")).toBe("demo.mp4");
  });

  it("uses storage-hosted WebP variants for the optimized large assets", () => {
    const optimizedAssets = [images.hero, images.preserveEnglish, images.preserveArabic, images.definitionEnglish, images.definitionArabic, images.beforeAfterRollsEnglish, images.beforeAfterRollsArabic, images.premiumProtectionEnglish, images.premiumProtectionArabic, images.beforeProtectionAfterEnglish, images.beforeProtectionAfterArabic, images.scratchCostEnglish, images.scratchCostArabic];
    expect(optimizedAssets.every((asset) => asset.endsWith(".webp"))).toBe(true);
    expect(optimizedAssets.every((asset) => asset.startsWith("/manus-storage/"))).toBe(true);
  });

  it("keeps crawler metadata on the PPFStudio live domain", () => {
    const root = path.resolve(process.cwd());
    const html = fs.readFileSync(path.join(root, "client/index.html"), "utf8");
    const robots = fs.readFileSync(path.join(root, "client/public/robots.txt"), "utf8");
    const sitemap = fs.readFileSync(path.join(root, "client/public/sitemap.xml"), "utf8");
    for (const content of [html, robots, sitemap]) {
      expect(content).not.toContain("aurelis.manus.space");
      expect(content).toContain("frontendweb-ewq8pgsm.manus.space");
    }
  });
});
