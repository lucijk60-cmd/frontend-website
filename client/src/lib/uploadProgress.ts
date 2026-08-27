export type UploadBinaryInput = {
  kind: "image" | "video";
  language: "en" | "ar" | "shared";
  pairKey?: string;
  title: string;
  fileName: string;
  mimeType: string;
  publish: boolean;
};

type ProgressCallback = (percent: number) => void;

type UploadResponse = { success?: boolean; id?: number; url?: string; message?: string };

export function uploadMediaWithProgress(input: UploadBinaryInput, file: File, onProgress: ProgressCallback) {
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
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error("Network error while uploading the media asset."));
    request.onabort = () => reject(new Error("Media upload was cancelled."));
    request.onload = () => {
      let payload: UploadResponse = {};
      try { payload = JSON.parse(request.responseText) as UploadResponse; } catch { /* handled by status below */ }
      if (request.status < 200 || request.status >= 300 || payload.success !== true) {
        reject(new Error(payload.message ?? `Upload request failed (${request.status}).`));
        return;
      }
      onProgress(100);
      resolve(payload);
    };
    request.send(file);
  });
}
