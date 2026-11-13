import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  auth,
  db,
  handleFirestoreError,
  isOwnerFirebaseUser,
  OperationType,
} from "./firebase";
import type { SiteCustomization } from "./siteCustomization";

export type FirebaseMediaItem = {
  id: string;
  kind: "image" | "video";
  language: "en" | "ar" | "shared";
  pairKey?: string;
  title: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  totalChunks?: number;
  status: "draft" | "published";
  createdAt?: unknown;
};

// 650 KB base64 per Firestore document chunk (well below Firestore's 1 MB limit and 800 KB security rule cap)
const CHUNK_SIZE = 650_000;
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB (matches firestore.rules 52,428,800 bytes)
const CHUNK_CONCURRENCY = 4;

// In-memory cache for reconstructed Blob Object URLs
const blobUrlCache = new Map<string, string>();
const loadingPromises = new Map<string, Promise<string>>();

function getMediaOwnerId(): string {
  if (isOwnerFirebaseUser(auth.currentUser) && auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  return "admin-passcode";
}

function sanitizeFileName(rawName: string, kind: "image" | "video"): string {
  const cleaned = (rawName || "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 60);
  if (cleaned.length >= 3 && !cleaned.startsWith(".")) {
    return cleaned;
  }
  const extMatch = (rawName || "").match(/\.[a-zA-Z0-9]{2,5}$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : kind === "video" ? ".mp4" : ".jpg";
  return `media_${Date.now()}${ext}`;
}

function normalizeTitle(rawTitle: string, fallback: string): string {
  const trimmed = rawTitle.trim().slice(0, 180);
  if (trimmed.length >= 2) return trimmed;
  const fb = fallback.trim().slice(0, 180);
  return fb.length >= 2 ? fb : "PPF Media Asset";
}

export async function readFileAsBase64(file: Blob): Promise<string> {
  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? "");
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(new Error("Unable to read file as base64."));
      reader.readAsDataURL(file);
    });
  }
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export type UploadFirebaseMediaInput = {
  kind: "image" | "video";
  language: "en" | "ar" | "shared";
  pairKey?: string;
  title: string;
  fileName: string;
  mimeType: string;
  publish: boolean;
  directUrl?: string;
};

async function uploadChunksParallel(
  mediaId: string,
  base64: string,
  onChunkProgress: (completedChunks: number, totalChunks: number) => void
): Promise<number> {
  const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);
  if (totalChunks > 200) {
    throw new Error("File is too large for Firestore chunk storage (max 200 chunks / ~50 MB).");
  }

  let completed = 0;
  for (let start = 0; start < totalChunks; start += CHUNK_CONCURRENCY) {
    const batchPromises: Array<Promise<void>> = [];
    const end = Math.min(totalChunks, start + CHUNK_CONCURRENCY);
    for (let i = start; i < end; i++) {
      const chunkId = `chunk_${String(i).padStart(4, "0")}`;
      const chunkData = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkPath = `adminMedia/${mediaId}/chunks/${chunkId}`;
      const p = setDoc(doc(db, "adminMedia", mediaId, "chunks", chunkId), {
        mediaId,
        chunkIndex: i,
        data: chunkData,
        createdAt: serverTimestamp(),
      })
        .then(() => {
          completed += 1;
          onChunkProgress(completed, totalChunks);
        })
        .catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, chunkPath);
        });
      batchPromises.push(p);
    }
    await Promise.all(batchPromises);
  }
  return totalChunks;
}

export async function uploadMediaToFirebase(
  input: UploadFirebaseMediaInput,
  file: File | null,
  onProgress: (percent: number) => void
): Promise<{ success: boolean; id: string; url: string }> {
  const safeName = sanitizeFileName(input.fileName || "media", input.kind);
  const mediaId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const ownerId = getMediaOwnerId();
  const safeTitle = normalizeTitle(input.title, safeName);
  const path = `adminMedia/${mediaId}`;

  // If user provided a direct URL (e.g. YouTube, Vimeo, Cloudinary, MP4 URL)
  if (input.directUrl && input.directUrl.trim()) {
    const cleanUrl = input.directUrl.trim();
    onProgress(50);
    const docData: Record<string, unknown> = {
      ownerId,
      kind: input.kind,
      language: input.language,
      title: safeTitle,
      storageKey: `direct/${safeName}`.slice(0, 256),
      url: cleanUrl,
      mimeType: (input.mimeType || (input.kind === "video" ? "video/mp4" : "image/jpeg")).slice(0, 120),
      sizeBytes: 1024,
      status: input.publish ? "published" : "draft",
      createdAt: serverTimestamp(),
    };
    if (input.pairKey) {
      docData.pairKey = input.pairKey.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
    }
    try {
      await setDoc(doc(db, "adminMedia", mediaId), docData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    onProgress(100);
    return { success: true, id: mediaId, url: cleanUrl };
  }

  if (!file) {
    throw new Error("No media file provided for upload.");
  }

  if (file.size <= 0) {
    throw new Error("Selected file is empty.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File exceeds maximum 50 MB Firebase upload limit.");
  }

  onProgress(10);
  const mimeType = (file.type || (input.kind === "video" ? "video/mp4" : "image/jpeg")).slice(0, 120);
  const base64 = await readFileAsBase64(file);
  onProgress(25);

  const isSmall = base64.length <= CHUNK_SIZE;

  // Immediate local cache
  try {
    const localBlobUrl = URL.createObjectURL(file);
    blobUrlCache.set(mediaId, localBlobUrl);
  } catch {
    // Ignore local blob URL creation errors
  }

  if (isSmall) {
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const docData: Record<string, unknown> = {
      ownerId,
      kind: input.kind,
      language: input.language,
      title: safeTitle,
      storageKey: `admin-media/${input.kind}/${safeName}`.slice(0, 256),
      url: dataUrl,
      mimeType,
      sizeBytes: file.size,
      status: input.publish ? "published" : "draft",
      createdAt: serverTimestamp(),
    };
    if (input.pairKey) {
      docData.pairKey = input.pairKey.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
    }

    try {
      await setDoc(doc(db, "adminMedia", mediaId), docData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    onProgress(100);
    return { success: true, id: mediaId, url: dataUrl };
  }

  // Large file: chunked upload into /adminMedia/{mediaId}/chunks/{chunkId}
  const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);
  if (totalChunks > 200) {
    throw new Error("File is too large for Firestore chunk storage (max ~50 MB).");
  }

  const docData: Record<string, unknown> = {
    ownerId,
    kind: input.kind,
    language: input.language,
    title: safeTitle,
    storageKey: `admin-media/${input.kind}/${safeName}`.slice(0, 256),
    url: `firestore://${mediaId}`,
    mimeType,
    sizeBytes: file.size,
    totalChunks,
    status: input.publish ? "published" : "draft",
    createdAt: serverTimestamp(),
  };
  if (input.pairKey) {
    docData.pairKey = input.pairKey.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  }

  // 1. Create parent metadata doc first (required by Master Gate existence check in firestore.rules)
  try {
    await setDoc(doc(db, "adminMedia", mediaId), docData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
  onProgress(35);

  // 2. Upload chunks in parallel batches
  await uploadChunksParallel(mediaId, base64, (completed, total) => {
    const progressPercent = Math.min(98, 35 + Math.round((completed / total) * 63));
    onProgress(progressPercent);
  });

  onProgress(100);
  return { success: true, id: mediaId, url: `firestore://${mediaId}` };
}

export async function resolveMediaUrl(
  mediaId: string,
  url: string,
  mimeType = "image/jpeg"
): Promise<string> {
  if (!url) return "";
  if (!url.startsWith("firestore://")) {
    return url;
  }

  const targetId = url.replace(/^firestore:\/\//, "").trim() || mediaId;
  const cached = blobUrlCache.get(targetId);
  if (cached) return cached;

  if (loadingPromises.has(targetId)) {
    return loadingPromises.get(targetId)!;
  }

  const loadPromise = (async () => {
    try {
      let resolvedMime = mimeType;
      if (!mimeType || mimeType === "image/jpeg") {
        try {
          const parentSnap = await getDoc(doc(db, "adminMedia", targetId));
          const parentData = parentSnap.data();
          if (parentData?.mimeType && typeof parentData.mimeType === "string") {
            resolvedMime = parentData.mimeType;
          }
        } catch {
          // keep provided mimeType
        }
      }

      const chunksSnap = await getDocs(
        query(collection(db, "adminMedia", targetId, "chunks"), orderBy("chunkIndex", "asc"))
      );
      if (chunksSnap.empty) {
        return "";
      }
      let fullBase64 = "";
      chunksSnap.docs.forEach((d) => {
        const chunk = d.data() as { data?: string };
        if (chunk.data) fullBase64 += chunk.data;
      });
      const blob = base64ToBlob(fullBase64, resolvedMime);
      const objUrl = URL.createObjectURL(blob);
      blobUrlCache.set(targetId, objUrl);
      return objUrl;
    } catch (err) {
      console.warn("Could not reconstruct firestore media chunk:", err);
      return "";
    } finally {
      loadingPromises.delete(targetId);
    }
  })();

  loadingPromises.set(targetId, loadPromise);
  return loadPromise;
}

export function useResolvedMediaUrl(url: string | undefined, mimeType = "image/jpeg"): string {
  const raw = url || "";
  const isFirestoreRef = raw.startsWith("firestore://");
  const initial = isFirestoreRef ? blobUrlCache.get(raw.replace(/^firestore:\/\//, "")) || "" : raw;
  const [resolved, setResolved] = useState<string>(initial);

  useEffect(() => {
    if (!raw) {
      setResolved("");
      return;
    }
    if (!raw.startsWith("firestore://")) {
      setResolved(raw);
      return;
    }
    const targetId = raw.replace(/^firestore:\/\//, "");
    const cached = blobUrlCache.get(targetId);
    if (cached) {
      setResolved(cached);
      return;
    }
    let active = true;
    void resolveMediaUrl(targetId, raw, mimeType).then((nextUrl) => {
      if (active && nextUrl) {
        setResolved(nextUrl);
      }
    });
    return () => {
      active = false;
    };
  }, [raw, mimeType]);

  return resolved;
}

export async function fetchFirestoreAdminMedia(publishedOnly = false): Promise<FirebaseMediaItem[]> {
  const path = "adminMedia";
  try {
    const colRef = collection(db, path);
    const q = publishedOnly ? query(colRef, where("status", "==", "published")) : colRef;
    const snap = await getDocs(q);
    const items: FirebaseMediaItem[] = [];

    for (const d of snap.docs) {
      const data = d.data();
      items.push({
        id: d.id,
        kind: data.kind || "image",
        language: data.language || "shared",
        pairKey: data.pairKey,
        title: data.title || "",
        storageKey: data.storageKey || "",
        url: data.url || "",
        mimeType: data.mimeType || "image/jpeg",
        sizeBytes: data.sizeBytes || 0,
        totalChunks: data.totalChunks,
        status: data.status || "published",
        createdAt: data.createdAt,
      });
    }

    // Sort newest first (id starts with m_<timestamp>_)
    items.sort((a, b) => b.id.localeCompare(a.id));
    return items;
  } catch (err) {
    console.warn("Failed to fetch admin media from Firestore:", err);
    return [];
  }
}

export async function deleteFirestoreAdminMedia(mediaId: string): Promise<void> {
  const safeId = mediaId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  const path = `adminMedia/${safeId}`;
  try {
    const chunksSnap = await getDocs(collection(db, "adminMedia", safeId, "chunks"));
    for (const d of chunksSnap.docs) {
      await deleteDoc(d.ref).catch(() => {});
    }
  } catch {
    // ignore chunk cleanup errors if none exist
  }
  try {
    await deleteDoc(doc(db, "adminMedia", safeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
  const cached = blobUrlCache.get(safeId);
  if (cached) {
    try {
      URL.revokeObjectURL(cached);
    } catch {}
    blobUrlCache.delete(safeId);
  }
}

export async function updateFirestoreMedia(
  mediaId: string,
  updates: { title?: string; status?: "draft" | "published" }
): Promise<void> {
  const safeId = mediaId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  const path = `adminMedia/${safeId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (typeof updates.title === "string" && updates.title.trim().length >= 2) {
    payload.title = updates.title.trim().slice(0, 180);
  }
  if (updates.status) {
    payload.status = updates.status;
  }
  try {
    await updateDoc(doc(db, "adminMedia", safeId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateFirestoreMediaStatus(
  mediaId: string,
  status: "draft" | "published"
): Promise<void> {
  return updateFirestoreMedia(mediaId, { status });
}

export async function replaceFirestoreMediaFile(
  mediaId: string,
  kind: "image" | "video",
  file: File,
  onProgress: (percent: number) => void = () => {}
): Promise<string> {
  const safeId = mediaId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  const path = `adminMedia/${safeId}`;

  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    throw new Error("Replacement file must be between 1 byte and 50 MB.");
  }

  onProgress(10);
  const mimeType = (file.type || (kind === "video" ? "video/mp4" : "image/jpeg")).slice(0, 120);
  const safeName = sanitizeFileName(file.name, kind);
  const base64 = await readFileAsBase64(file);
  onProgress(25);

  // Clean up existing chunks before replacing
  try {
    const oldChunks = await getDocs(collection(db, "adminMedia", safeId, "chunks"));
    for (const c of oldChunks.docs) {
      await deleteDoc(c.ref).catch(() => {});
    }
  } catch {
    // ignore
  }

  const oldCached = blobUrlCache.get(safeId);
  if (oldCached) {
    try {
      URL.revokeObjectURL(oldCached);
    } catch {}
    blobUrlCache.delete(safeId);
  }

  try {
    blobUrlCache.set(safeId, URL.createObjectURL(file));
  } catch {}

  const isSmall = base64.length <= CHUNK_SIZE;
  if (isSmall) {
    const dataUrl = `data:${mimeType};base64,${base64}`;
    try {
      await updateDoc(doc(db, "adminMedia", safeId), {
        storageKey: `admin-media/${kind}/${safeName}`.slice(0, 256),
        url: dataUrl,
        mimeType,
        sizeBytes: file.size,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
    onProgress(100);
    return dataUrl;
  }

  const totalChunks = await uploadChunksParallel(safeId, base64, (completed, total) => {
    onProgress(Math.min(95, 25 + Math.round((completed / total) * 70)));
  });

  const firestoreUrl = `firestore://${safeId}`;
  try {
    await updateDoc(doc(db, "adminMedia", safeId), {
      storageKey: `admin-media/${kind}/${safeName}`.slice(0, 256),
      url: firestoreUrl,
      mimeType,
      sizeBytes: file.size,
      totalChunks,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
  onProgress(100);
  return firestoreUrl;
}

export async function saveSiteConfigToFirestore(config: SiteCustomization): Promise<void> {
  if (!isOwnerFirebaseUser(auth.currentUser) || !auth.currentUser?.uid) {
    throw new Error("Owner Gmail sign-in (jabedjk112@gmail.com) is required to sync site customization to Firebase.");
  }
  const ownerId = auth.currentUser.uid;
  const jsonStr = JSON.stringify(config);
  if (jsonStr.length > 500_000) {
    throw new Error("Site configuration exceeds 500 KB Firestore limit. Upload large media via Firebase Media instead of inline base64.");
  }
  const path = "siteConfig/current";
  try {
    await setDoc(doc(db, "siteConfig", "current"), {
      ownerId,
      configJson: jsonStr,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadSiteConfigFromFirestore(): Promise<SiteCustomization | null> {
  try {
    const snap = await getDoc(doc(db, "siteConfig", "current"));
    if (snap.exists()) {
      const data = snap.data();
      if (data && typeof data.configJson === "string") {
        return JSON.parse(data.configJson) as SiteCustomization;
      }
    }
    return null;
  } catch (err) {
    console.warn("Could not load site config from Firestore:", err);
    return null;
  }
}
