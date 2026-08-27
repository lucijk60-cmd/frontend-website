import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { selectVideoSource } from "./media";

describe("full website audit regressions", () => {
  it("uses the uploaded video URL instead of the static demo source", () => {
    expect(selectVideoSource({ src: "/manus-storage/admin-media/video/en/file.mp4", isUploaded: true }, "demo.mp4")).toBe("/manus-storage/admin-media/video/en/file.mp4");
    expect(selectVideoSource({ src: "/poster.webp", isUploaded: false }, "demo.mp4")).toBe("demo.mp4");
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
