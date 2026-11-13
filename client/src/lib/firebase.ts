import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  inMemoryPersistence,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import firebaseConfig from "../../../firebase-applet-config.json";

export const OWNER_ADMIN_EMAIL = "jabedjk112@gmail.com";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
});
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function isOwnerFirebaseUser(user: User | null | undefined): boolean {
  return Boolean(
    user &&
      user.emailVerified &&
      user.email &&
      user.email.toLowerCase() === OWNER_ADMIN_EMAIL
  );
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type FirebaseConnectionStatus = {
  connected: boolean;
  offline: boolean;
  projectId: string;
  databaseId: string;
  error?: string;
};

export async function testConnection(): Promise<FirebaseConnectionStatus> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return {
      connected: true,
      offline: false,
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const isOffline = msg.includes("the client is offline");
    if (isOffline) {
      console.error("Please check your Firebase configuration.", msg);
    }
    // Permission-denied still means the server is reachable, though /test/connection allows get
    const serverReached = !isOffline && msg.toLowerCase().includes("permission");
    return {
      connected: serverReached,
      offline: isOffline,
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      error: serverReached ? undefined : msg,
    };
  }
}

export async function signInWithGooglePopup() {
  return signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
}

export async function signOutFirebase() {
  return signOut(auth);
}

export async function fetchApprovedFirestoreReviews() {
  const path = "reviews";
  try {
    const q = query(collection(db, path), where("status", "==", "approved"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveReviewToFirestore(reviewId: string, payload: {
  publicReference: string;
  name: string;
  vehicle?: string;
  rating: number;
  review: string;
}) {
  if (!auth.currentUser) return;
  const safeId = reviewId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  const path = `reviews/${safeId}`;
  try {
    const docData: Record<string, unknown> = {
      authorId: auth.currentUser.uid,
      publicReference: payload.publicReference.slice(0, 32),
      name: payload.name.slice(0, 120),
      rating: Math.min(5, Math.max(1, Math.round(payload.rating))),
      review: payload.review.slice(0, 1000),
      status: "pending",
      createdAt: serverTimestamp(),
    };
    if (payload.vehicle && payload.vehicle.trim()) {
      docData.vehicle = payload.vehicle.trim().slice(0, 120);
    }
    await setDoc(doc(db, "reviews", safeId), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateReviewStatusInFirestore(reviewId: string, status: "approved" | "rejected") {
  if (!auth.currentUser) return;
  const safeId = reviewId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  const path = `reviews/${safeId}`;
  try {
    await updateDoc(doc(db, "reviews", safeId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReviewFromFirestore(reviewId: string) {
  if (!auth.currentUser) return;
  const safeId = reviewId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  const path = `reviews/${safeId}`;
  try {
    await deleteDoc(doc(db, "reviews", safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAdminMediaFromFirestore(mediaId: string) {
  if (!auth.currentUser) return;
  const safeId = mediaId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128);
  const path = `adminMedia/${safeId}`;
  try {
    await deleteDoc(doc(db, "adminMedia", safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
