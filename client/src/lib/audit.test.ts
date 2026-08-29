import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { selectVideoSource } from "./media";
import { embeddedImages } from "./embeddedImageAssets";
import { externalImageFallbacks, images, whatsappHref, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "./siteContent";

describe("full website audit regressions", () => {
  it("uses the uploaded video URL instead of the static demo source", () => {
    expect(selectVideoSource({ src: "/manus-storage/admin-media/video/en/file.mp4", isUploaded: true }, "demo.mp4")).toBe("/manus-storage/admin-media/video/en/file.mp4");
    expect(selectVideoSource({ src: "/poster.webp", isUploaded: false }, "demo.mp4")).toBe("demo.mp4");
  });

  it("uses embedded sources while retaining storage-hosted fallbacks", () => {
    const optimizedKeys = ["hero", "preserveEnglish", "preserveArabic", "definitionEnglish", "definitionArabic", "beforeAfterRollsEnglish", "beforeAfterRollsArabic", "premiumProtectionEnglish", "premiumProtectionArabic", "beforeProtectionAfterEnglish", "beforeProtectionAfterArabic", "scratchCostEnglish", "scratchCostArabic"] as const;
    expect(optimizedKeys.every((key) => images[key].startsWith("data:image/"))).toBe(true);
    expect(optimizedKeys.every((key) => externalImageFallbacks[key].startsWith("/manus-storage/"))).toBe(true);
    expect(embeddedImages.hero.startsWith("data:image/webp;base64,")).toBe(true);
  });

  it("uses the updated WhatsApp contact in display and generated links", () => {
    expect(WHATSAPP_NUMBER).toBe("966537358631");
    expect(WHATSAPP_DISPLAY).toBe("+966 53 735 8631");
    expect(whatsappHref("en")).toContain("https://wa.me/966537358631?text=");
    expect(whatsappHref("ar")).toContain("https://wa.me/966537358631?text=");
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
