import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const hasGateSecrets = Boolean(process.env.ADMIN_GATE_PASSWORD && process.env.PPF_GATE_PASSWORD);

describe.skipIf(!hasGateSecrets)("admin.verifyGate", () => {
  it("accepts the configured two-password gate without exposing secret values", async () => {
    const cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
      res: { cookie: (name: string, value: string, options?: Record<string, unknown>) => cookies.push({ name, value, options }) } as TrpcContext["res"],
    } satisfies TrpcContext;

    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.verifyGate({
      password: process.env.ADMIN_GATE_PASSWORD ?? "",
      ppfPassword: process.env.PPF_GATE_PASSWORD ?? "",
    });

    expect(result).toMatchObject({ success: true });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("ppfPassword");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.options).toMatchObject({ sameSite: "none", secure: true });
  });

  it("accepts the first-two-password Admin flow", async () => {
    const cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {}, ip: "127.0.0.3" } as TrpcContext["req"],
      res: { cookie: (name: string, value: string, options?: Record<string, unknown>) => cookies.push({ name, value, options }) } as TrpcContext["res"],
    } satisfies TrpcContext;
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.verifyGate({
      password: process.env.ADMIN_GATE_PASSWORD ?? "",
      ppfPassword: process.env.PPF_GATE_PASSWORD ?? "",
    });
    expect(result).toEqual({ success: true });
    expect(cookies).toHaveLength(1);
  });

  it("rejects a gate when either required password is incorrect", async () => {
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {}, ip: "127.0.0.2" } as TrpcContext["req"],
      res: { cookie: () => undefined } as TrpcContext["res"],
    } satisfies TrpcContext;

    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.verifyGate({
      password: "definitely-not-the-gate-password",
      ppfPassword: process.env.PPF_GATE_PASSWORD ?? "",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
