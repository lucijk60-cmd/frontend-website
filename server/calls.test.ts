import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {}, ip: "call-test" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("calls", () => {
  it("creates a database-backed session and returns a customer token", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.calls.createSession({ businessId: "PPFSTUDIO001", callerSessionId: "browser-test-session" });

    expect(result.callId).toMatch(/^call-/);
    expect(result.customerToken).toHaveLength(72);
    expect(result.status).toBe("calling");
    expect(result.signalingPath).toBe("/api/call-signaling");

    const status = await caller.calls.status({ callId: result.callId, customerToken: result.customerToken });
    expect(status?.status).toBe("calling");

    await caller.calls.end({ callId: result.callId, customerToken: result.customerToken });
    const ended = await caller.calls.status({ callId: result.callId, customerToken: result.customerToken });
    expect(ended?.status).toBe("ended");
  });

  it("does not reveal call status for an invalid customer token", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.calls.createSession({ businessId: "PPFSTUDIO001" });

    await expect(caller.calls.status({ callId: result.callId, customerToken: "x".repeat(72) })).resolves.toBeNull();
    await caller.calls.end({ callId: result.callId, customerToken: result.customerToken });
  });
});
