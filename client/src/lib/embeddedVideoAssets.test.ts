import { describe, expect, it } from "vitest";
import { embeddedVideos } from "./embeddedVideoAssets";


describe("embedded video assets", () => {
  it("contains the owner-provided video as an MP4 data URI or valid MP4 URL", () => {
    expect(embeddedVideos.ppfInstallation).toMatch(/^(data:video\/mp4;base64,[A-Za-z0-9+/=]+|https:\/\/.+\.mp4)$/);
    expect(embeddedVideos.ppfInstallation.length).toBeGreaterThan(20);
  });
});
