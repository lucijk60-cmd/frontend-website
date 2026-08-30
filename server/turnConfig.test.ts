import { describe, expect, it } from "vitest";
import { buildIceServers } from "./turnConfig";

describe("TURN/ICE configuration", () => {
  it("does not expose or invent TURN credentials when configuration is missing", () => {
    expect(buildIceServers({})).toEqual([{ urls: ["stun:stun.l.google.com:19302"] }]);
  });

  it("returns configured TURN credentials only to the server-side configuration consumer", () => {
    expect(
      buildIceServers({
        turnUrl: "turns:turn.example.com:5349",
        turnUsername: "operator",
        turnCredential: "secret-value",
      }),
    ).toEqual([
      { urls: ["stun:stun.l.google.com:19302"] },
      { urls: ["turns:turn.example.com:5349"], username: "operator", credential: "secret-value" },
    ]);
  });
});
