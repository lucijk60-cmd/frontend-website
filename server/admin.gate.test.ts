import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("admin.verifyGate", () => {
  it("accepts the configured four-secret gate without exposing secret values", async () => {
    const cookies: Array<{ name: string; value: string }> = [];
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
      res: { cookie: (name: string, value: string) => cookies.push({ name, value }) } as TrpcContext["res"],
    } satisfies TrpcContext;

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.verifyGate({
      password: process.env.ADMIN_GATE_PASSWORD ?? "",
      ppfPassword: process.env.PPF_GATE_PASSWORD ?? "",
      adminPassword: process.env.ADMIN_PANEL_PASSWORD ?? "",
      privatePassword: process.env.PRIVATE_ACCESS_PASSWORD ?? "",
    });

    expect(result).toMatchObject({ success: true });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("ppfPassword");
    expect(result).not.toHaveProperty("adminPassword");
    expect(result).not.toHaveProperty("privatePassword");
    expect(cookies).toHaveLength(1);
  });
});
