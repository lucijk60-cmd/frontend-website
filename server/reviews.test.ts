import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("reviews", () => {
  it("rejects submissions that do not meet the review contract", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.reviews.submit({
      name: "A",
      rating: 6,
      review: "too short",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns a count and approved review collection", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.reviews.list({ limit: 1, offset: 0 });

    expect(result).toHaveProperty("total");
    expect(result.total).toBeTypeOf("number");
    expect(result.items).toBeInstanceOf(Array);
    expect(result.items.every((review) => review.status === "approved")).toBe(true);
  });

  it("keeps pending submissions out of the public review collection", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.reviews.list({ limit: 50, offset: 0 });

    expect(result.items.some((review) => review.status === "pending")).toBe(false);
  });

  it("rejects malformed public reference codes", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.reviews.statusByReference({ publicReference: "not-a-reference" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
