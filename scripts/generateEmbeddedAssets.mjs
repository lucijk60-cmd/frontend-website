import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const outputPath = fileURLToPath(new URL("../client/src/lib/embeddedImageAssets.ts", import.meta.url));
const assets = {
  hero: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/obsidian-hero_414be125.webp", "image/webp"],
  galleryCoupe: ["/home/ubuntu/webdev-static-assets/ppf-studio-black-car.jpg", "image/jpeg"],
  detailSuv: ["/home/ubuntu/webdev-static-assets/ppf-installation-detail.jpg", "image/jpeg"],
  mark: ["/home/ubuntu/webdev-static-assets/ppf-logo-user-640.webp", "image/webp"],
  preserveEnglish: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-preserve-en_a8652e9f.webp", "image/webp"],
  preserveArabic: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-preserve-ar_ae6423a7.webp", "image/webp"],
  definitionEnglish: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-definition-en_ccdaafe2.webp", "image/webp"],
  definitionArabic: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-definition-ar_ff569d7f.webp", "image/webp"],
  beforeAfterRollsEnglish: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-before-after-rolls-en_9f002695.webp", "image/webp"],
  beforeAfterRollsArabic: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-before-after-rolls-ar_39628be9.webp", "image/webp"],
  premiumProtectionEnglish: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-premium-protection-en_71f2cef3.webp", "image/webp"],
  premiumProtectionArabic: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-premium-protection-ar_b59e9cda.webp", "image/webp"],
  beforeProtectionAfterEnglish: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-before-protection-after-en_fef2eab0.webp", "image/webp"],
  beforeProtectionAfterArabic: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-before-protection-after-ar_d6d869c9.webp", "image/webp"],
  scratchCostEnglish: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-scratch-cost-en_6103e150.webp", "image/webp"],
  scratchCostArabic: ["/home/ubuntu/webdev-static-assets/ppfstudio-optimized-webp/ppf-scratch-cost-ar_ff3ce699.webp", "image/webp"],
};

const lines = [
  "/* Generated local-only image data module. Keep external URL fallback in siteContent.ts. */",
  "export const embeddedImages = {",
];
for (const [name, [filePath, mimeType]] of Object.entries(assets)) {
  const encoded = readFileSync(filePath).toString("base64");
  lines.push(`  ${name}: \"data:${mimeType};base64,${encoded}\",`);
}
lines.push("} as const;", "");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, lines.join("\n"));
console.log(`Generated ${Object.keys(assets).length} embedded image assets.`);
