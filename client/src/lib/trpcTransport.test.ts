import { describe, expect, it } from "vitest";
import { normalizeTrpcResponse, REVIEW_SERVICE_ERROR } from "./trpcTransport";

describe("normalizeTrpcResponse", () => {
  it("turns an empty response into a parseable service error", async () => {
    const normalized = await normalizeTrpcResponse(new Response("", { status: 200 }));
    const payload = await normalized.json();

    expect(normalized.status).toBe(500);
    expect(payload[0].error.json.message).toBe(REVIEW_SERVICE_ERROR);
  });

  it("preserves valid JSON tRPC responses", async () => {
    const body = JSON.stringify([{ result: { data: { json: { ok: true } } } }]);
    const normalized = await normalizeTrpcResponse(new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    expect(normalized.status).toBe(200);
    expect(await normalized.text()).toBe(body);
  });

  it("converts a static HTML fallback into a clear service error", async () => {
    const normalized = await normalizeTrpcResponse(new Response("<!doctype html><html></html>", { status: 200 }));

    expect(normalized.status).toBe(500);
    expect((await normalized.json())[0].error.json.message).toContain("full-stack website host");
  });
});
