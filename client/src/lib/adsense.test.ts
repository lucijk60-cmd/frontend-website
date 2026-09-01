import { describe, expect, it } from "vitest";
import { ADSENSE_CONFIG } from "@/components/AdSenseUnit";

describe("AdSense media placement contract", () => {
  it("keeps the owner-provided Ad1 client and slot", () => {
    expect(ADSENSE_CONFIG).toEqual({
      client: "ca-pub-4139233794403283",
      slot: "6863052081",
    });
  });

  it("uses a responsive unit contract", () => {
    expect(ADSENSE_CONFIG.client).toMatch(/^ca-pub-\d+$/);
    expect(ADSENSE_CONFIG.slot).toMatch(/^\d+$/);
  });
});
