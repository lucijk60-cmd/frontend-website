import { uploadMediaToFirebase } from "./firebaseMedia";

export type UploadBinaryInput = {
  kind: "image" | "video";
  language: "en" | "ar" | "shared";
  pairKey?: string;
  title: string;
  fileName: string;
  mimeType: string;
  publish: boolean;
  directUrl?: string;
};

type ProgressCallback = (percent: number) => void;

export type UploadResponse = {
  success?: boolean;
  id?: string | number;
  url?: string;
  message?: string;
};

export async function uploadMediaWithProgress(
  input: UploadBinaryInput,
  file: File | null,
  onProgress: ProgressCallback
): Promise<UploadResponse> {
  const isVitest =
    typeof process !== "undefined" &&
    (process.env?.NODE_ENV === "test" || Boolean(process.env?.VITEST)) &&
    !input.directUrl;
  let lastError: unknown = null;

  // Primary: Direct Firebase upload (works on static hosting, IONOS, ppfstudio.online, and full-stack)
  if (!isVitest) {
    try {
      const res = await uploadMediaToFirebase(
        {
          kind: input.kind,
          language: input.language,
          pairKey: input.pairKey,
          title: input.title,
          fileName: input.fileName,
          mimeType: input.mimeType,
          publish: input.publish,
          directUrl: input.directUrl,
        },
        file,
        onProgress
      );
      return {
        success: true,
        id: res.id,
        url: res.url,
      };
    } catch (firebaseError) {
      lastError = firebaseError;
      console.warn("Direct Firebase upload notice, trying server fallback:", firebaseError);
    }
  }

  // If file is present and server endpoint is reachable (e.g. local Node dev server or unit tests)
  if (file && typeof XMLHttpRequest !== "undefined") {
    return new Promise<UploadResponse>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", "/api/admin/media/upload-binary", true);
      request.withCredentials = true;
      request.setRequestHeader("content-type", "application/octet-stream");
      request.setRequestHeader("x-media-kind", input.kind);
      request.setRequestHeader("x-media-language", input.language);
      request.setRequestHeader("x-media-title", encodeURIComponent(input.title));
      request.setRequestHeader("x-media-filename", encodeURIComponent(input.fileName));
      request.setRequestHeader("x-media-mime-type", input.mimeType);
      request.setRequestHeader("x-media-publish", String(input.publish));
      if (input.pairKey) request.setRequestHeader("x-media-pair-key", input.pairKey);

      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      request.onerror = () => {
        const detail =
          lastError instanceof Error ? lastError.message : "Network error while uploading the media asset.";
        reject(new Error(detail));
      };

      request.onabort = () => reject(new Error("Media upload was cancelled."));

      request.onload = () => {
        let payload: UploadResponse = {};
        try {
          payload = JSON.parse(request.responseText) as UploadResponse;
        } catch {
          /* handled by status check */
        }
        if (request.status < 200 || request.status >= 300 || payload.success !== true) {
          const detail =
            lastError instanceof Error ? lastError.message : payload.message ?? `Upload failed (${request.status}).`;
          reject(new Error(detail));
          return;
        }
        onProgress(100);
        resolve(payload);
      };

      request.send(file);
    });
  }

  throw lastError instanceof Error ? lastError : new Error("Media upload failed.");
}
