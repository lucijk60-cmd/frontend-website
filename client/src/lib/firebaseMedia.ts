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
import { auth, db } from "./firebase";
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

// In-memory cache for reconstructed Blob Object URLs
const blobUrlCache = new Map<string, string>();
const loadingPromises = new Map<string, Promise<string>>();

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

export async function uploadMediaToFirebase(
  input: UploadFirebaseMediaInput,
  file: File | null,
  onProgress: (percent: number) => void
): Promise<{ success: boolean; id: string; url: string }> {
  const safeName = (input.fileName || "media")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 60);
  const mediaId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const ownerId = auth.currentUser?.uid || "admin-passcode";

  // If user provided a direct URL (e.g. YouTube, Vimeo, Cloudinary, MP4 URL)
  if (input.directUrl && input.directUrl.trim()) {
    const cleanUrl = input.directUrl.trim();
    onProgress(50);
    const docData: Record<string, unknown> = {
      ownerId,
      kind: input.kind,
      language: input.language,
      title: input.title.trim() || safeName,
      storageKey: `direct/${safeName}`,
      url: cleanUrl,
      mimeType: input.mimeType || (input.kind === "video" ? "video/mp4" : "image/jpeg"),
      sizeBytes: 1024,
      status: input.publish ? "published" : "draft",
      createdAt: serverTimestamp(),
    };
    if (input.pairKey) docData.pairKey = input.pairKey;
    await setDoc(doc(db, "adminMedia", mediaId), docData);
    onProgress(100);
    return { success: true, id: mediaId, url: cleanUrl };
  }

  if (!file) {
    throw new Error("No media file provided for upload.");
  }

  onProgress(10);
  const mimeType = file.type || (input.kind === "video" ? "video/mp4" : "image/jpeg");
  const base64 = await readFileAsBase64(file);
  onProgress(25);

  const CHUNK_SIZE = 350000; // ~350 KB per text chunk, safely under Firestore 1 MB doc limit
  const isSmall = base64.length <= CHUNK_SIZE;

  // Immediate local cache
  try {
    const localBlobUrl = URL.createObjectURL(file);
    blobUrlCache.set(mediaId, localBlobUrl);
  } catch {
    // Ignore local blob URL creation errors
  }

  if (isSmall) {
    // Fits into a single Firestore document
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const docData: Record<string, unknown> = {
      ownerId,
      kind: input.kind,
      language: input.language,
      title: input.title.trim() || safeName,
      storageKey: `admin-media/${input.kind}/${safeName}`,
      url: dataUrl,
      mimeType,
      sizeBytes: file.size,
      status: input.publish ? "published" : "draft",
      createdAt: serverTimestamp(),
    };
    if (input.pairKey) docData.pairKey = input.pairKey;

    await setDoc(doc(db, "adminMedia", mediaId), docData);
    onProgress(100);
    return { success: true, id: mediaId, url: dataUrl };
  }

  // Large file: chunked upload into /adminMedia/{mediaId}/chunks/{chunkId}
  const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);
  const docData: Record<string, unknown> = {
    ownerId,
    kind: input.kind,
    language: input.language,
    title: input.title.trim() || safeName,
    storageKey: `admin-media/${input.kind}/${safeName}`,
    url: `firestore://${mediaId}`,
    mimeType,
    sizeBytes: file.size,
    totalChunks,
    status: input.publish ? "published" : "draft",
    createdAt: serverTimestamp(),
  };
  if (input.pairKey) docData.pairKey = input.pairKey;

  // 1. Create main doc
  await setDoc(doc(db, "adminMedia", mediaId), docData);
  onProgress(35);

  // 2. Upload chunks in parallel with concurrency
  const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
  let uploadedCount = 0;

  for (let i = 0; i < totalChunks; i++) {
    const chunkId = `chunk_${String(i).padStart(4, "0")}`;
    const chunkData = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await setDoc(doc(db, "adminMedia", mediaId, "chunks", chunkId), {
      mediaId,
      chunkIndex: i,
      data: chunkData,
      createdAt: serverTimestamp(),
    });
    uploadedCount++;
    const progressPercent = Math.min(98, 35 + Math.round((uploadedCount / totalChunks) * 63));
    onProgress(progressPercent);
  }

  onProgress(100);
  return { success: true, id: mediaId, url: `firestore://${mediaId}` };
}

export async function resolveMediaUrl(mediaId: string, url: string, mimeType = "image/jpeg"): Promise<string> {
  if (!url) return "";
  if (!url.startsWith("firestore://")) {
    return url;
  }
  const cached = blobUrlCache.get(mediaId);
  if (cached) return cached;

  if (loadingPromises.has(mediaId)) {
    return loadingPromises.get(mediaId)!;
  }

  const loadPromise = (async () => {
    try {
      const chunksSnap = await getDocs(
        query(collection(db, "adminMedia", mediaId, "chunks"), orderBy("chunkIndex", "asc"))
      );
      if (chunksSnap.empty) {
        return url;
      }
      let fullBase64 = "";
      chunksSnap.docs.forEach((d) => {
        const chunk = d.data() as { data?: string };
        if (chunk.data) fullBase64 += chunk.data;
      });
      const blob = base64ToBlob(fullBase64, mimeType);
      const objUrl = URL.createObjectURL(blob);
      blobUrlCache.set(mediaId, objUrl);
      return objUrl;
    } catch (err) {
      console.warn("Could not reconstruct firestore media chunk:", err);
      return url;
    } finally {
      loadingPromises.delete(mediaId);
    }
  })();

  loadingPromises.set(mediaId, loadPromise);
  return loadPromise;
}

export async function fetchFirestoreAdminMedia(publishedOnly = false): Promise<FirebaseMediaItem[]> {
  try {
    const colRef = collection(db, "adminMedia");
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

    // Sort by id descending (since id starts with timestamp)
    items.sort((a, b) => b.id.localeCompare(a.id));
    return items;
  } catch (err) {
    console.warn("Failed to fetch admin media from Firestore:", err);
    return [];
  }
}

export async function deleteFirestoreAdminMedia(mediaId: string): Promise<void> {
  const safeId = mediaId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  // Delete chunks if any
  try {
    const chunksSnap = await getDocs(collection(db, "adminMedia", safeId, "chunks"));
    for (const d of chunksSnap.docs) {
      await deleteDoc(d.ref).catch(() => {});
    }
  } catch {
    // ignore
  }
  await deleteDoc(doc(db, "adminMedia", safeId));
  const cached = blobUrlCache.get(safeId);
  if (cached) {
    try {
      URL.revokeObjectURL(cached);
    } catch {}
    blobUrlCache.delete(safeId);
  }
}

export async function updateFirestoreMediaStatus(
  mediaId: string,
  status: "draft" | "published"
): Promise<void> {
  const safeId = mediaId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  await updateDoc(doc(db, "adminMedia", safeId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function saveSiteConfigToFirestore(config: SiteCustomization): Promise<void> {
  const ownerId = auth.currentUser?.uid || "jabedjk112";
  const jsonStr = JSON.stringify(config);
  await setDoc(doc(db, "siteConfig", "current"), {
    ownerId,
    configJson: jsonStr,
    updatedAt: serverTimestamp(),
  });
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
