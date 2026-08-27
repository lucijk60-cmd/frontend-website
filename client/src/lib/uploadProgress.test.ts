import { afterEach, describe, expect, it } from "vitest";
import { uploadMediaWithProgress } from "./uploadProgress";
import type { UploadBinaryInput } from "./uploadProgress";

const originalXHR = globalThis.XMLHttpRequest;

afterEach(() => {
  globalThis.XMLHttpRequest = originalXHR;
});

describe("uploadMediaWithProgress", () => {
  it("sends raw binary data with custom headers and forwards real upload progress", async () => {
    const progress: number[] = [];
    let sentBody: unknown;
    const headers: Record<string, string> = {};
    class FakeXHR {
      status = 200;
      responseText = JSON.stringify({ success: true });
      withCredentials = false;
      upload = { onprogress: (_event: { lengthComputable: boolean; loaded: number; total: number }) => {} };
      onload = () => {};
      onerror = () => {};
      onabort = () => {};
      open = () => {};
      setRequestHeader = (key: string, value: string) => { headers[key.toLowerCase()] = value; };
      send = (body: unknown) => {
        sentBody = body;
        this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
        this.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
        this.onload();
      };
    }
    globalThis.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;

    const input: UploadBinaryInput = { kind: "image", language: "en", title: "Test Title", fileName: "test.png", mimeType: "image/png", publish: true };
    const file = new File(["dummy content"], "test.png", { type: "image/png" });

    await uploadMediaWithProgress(input, file, percent => progress.push(percent));

    expect(progress).toEqual([50, 100, 100]);
    expect(sentBody).toBe(file);
    expect(headers["content-type"]).toBe("application/octet-stream");
    expect(headers["x-media-kind"]).toBe("image");
    expect(headers["x-media-language"]).toBe("en");
    expect(headers["x-media-title"]).toBe(encodeURIComponent("Test Title"));
  });
});
