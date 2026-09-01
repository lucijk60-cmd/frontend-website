import { describe, expect, it } from "vitest";
import { embeddedVideos } from "./embeddedVideoAssets";


describe("embedded video assets", () => {
  it("contains the owner-provided video as an MP4 data URI", () => {
    expect(embeddedVideos.ppfInstallation).toMatch(/^data:video\/mp4;base64,[A-Za-z0-9+/=]+$/);
    expect(embeddedVideos.ppfInstallation.length).toBeGreaterThan(1_000_000);
  });
});
