import { afterEach, describe, expect, it } from "vitest";
import { uploadMediaWithProgress } from "./uploadProgress";

const originalXHR = globalThis.XMLHttpRequest;

afterEach(() => {
  globalThis.XMLHttpRequest = originalXHR;
});

describe("uploadMediaWithProgress", () => {
  it("sends the tRPC batch envelope and forwards real upload progress", async () => {
    const progress: number[] = [];
    let sentBody: unknown;
    class FakeXHR {
      status = 200;
      responseText = JSON.stringify([{ result: { data: { json: { success: true } } } }]);
      withCredentials = false;
      upload = { onprogress: (_event: { lengthComputable: boolean; loaded: number; total: number }) => {} };
      onload = () => {};
      onerror = () => {};
      onabort = () => {};
      open = () => {};
      setRequestHeader = () => {};
      send = (body: string) => {
        sentBody = JSON.parse(body);
        this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
        this.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
        this.onload();
      };
    }
    globalThis.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;

    await uploadMediaWithProgress({ kind: "image", language: "en", title: "Test", fileName: "test.png", mimeType: "image/png", dataBase64: "a".repeat(32), publish: true }, percent => progress.push(percent));

    expect(progress).toEqual([50, 100, 100]);
    expect(sentBody).toEqual({ 0: { json: expect.objectContaining({ fileName: "test.png", language: "en" }) } });
  });
});
