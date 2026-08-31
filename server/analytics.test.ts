import { describe, expect, it } from "vitest";
import { hashVisitorKey } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("visitor analytics", () => {
  it("hashes visitor identifiers deterministically without returning the raw value", () => {
    const raw = "198.51.100.10|Mozilla/5.0";
    const hash = hashVisitorKey(raw);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(raw);
    expect(hashVisitorKey(raw)).toBe(hash);
  });

  it("keeps analytics behind the admin session", async () => {
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {}, ip: "127.0.0.4" } as TrpcContext["req"],
      res: { cookie: () => undefined } as TrpcContext["res"],
    } satisfies TrpcContext;
    await expect(appRouter.createCaller(ctx).admin.analytics()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
