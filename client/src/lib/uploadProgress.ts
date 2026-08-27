export type UploadProgressInput = {
  kind: "image" | "video";
  language: "en" | "ar" | "shared";
  pairKey?: string;
  title: string;
  fileName: string;
  mimeType: string;
  dataBase64: string;
  publish: boolean;
};

type ProgressCallback = (percent: number) => void;

type TrpcEnvelope = {
  result?: { data?: unknown };
  error?: { json?: { message?: string }; message?: string };
};

export function uploadMediaWithProgress(input: UploadProgressInput, onProgress: ProgressCallback) {
  return new Promise<unknown>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/trpc/admin.media.upload?batch=1", true);
    request.withCredentials = true;
    request.setRequestHeader("content-type", "application/json");
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error("Network error while uploading the media asset."));
    request.onabort = () => reject(new Error("Media upload was cancelled."));
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`Upload request failed (${request.status}).`));
        return;
      }
      try {
        const envelopes = JSON.parse(request.responseText) as TrpcEnvelope[];
        const envelope = envelopes[0];
        if (envelope?.error) {
          reject(new Error(envelope.error.json?.message ?? envelope.error.message ?? "Upload failed."));
          return;
        }
        onProgress(100);
        resolve(envelope?.result?.data);
      } catch {
        reject(new Error("The upload response could not be read."));
      }
    };
    request.send(JSON.stringify({ 0: { json: input } }));
  });
}
