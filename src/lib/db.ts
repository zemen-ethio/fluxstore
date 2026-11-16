import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
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

export const addCompressionJob = async (job: {
  fileName: string;
  fileType: string;
  originalSize: number;
  compressedSize: number;
  method: string;
  compressionRatio: number;
  savingsPercent: number;
  aiRecommended: boolean;
  title?: string;
  recipients?: string[];
  storageUrl?: string;
  expiryDays?: number;
  maxDownloads?: number;
  downloadCount?: number;
}) => {
  if (!auth.currentUser) {
    throw new Error("Must be logged in to create a compression job.");
  }

  const sanitizedRecipients = (job.recipients || [])
    .filter((r) => typeof r === "string" && r.trim().length > 0)
    .slice(0, 20)
    .map((r) => r.trim().slice(0, 256));

  const payload = {
    fileName: (job.fileName || "untitled").slice(0, 256),
    fileType: (job.fileType || "application/octet-stream").slice(0, 128),
    originalSize: Math.max(0, Number(job.originalSize) || 0),
    compressedSize: Math.max(0, Math.round(Number(job.compressedSize) || 0)),
    method: job.method || "ai",
    compressionRatio: Math.min(10, Math.max(0, Number(job.compressionRatio) || 0.5)),
    savingsPercent: Math.min(100, Math.max(0, Number(job.savingsPercent) || 0)),
    aiRecommended: Boolean(job.aiRecommended),
    title: (job.title || job.fileName || "untitled").slice(0, 256),
    recipients: sanitizedRecipients,
    storageUrl: (job.storageUrl || "").slice(0, 2048),
    expiryDays: Math.min(365, Math.max(1, Math.round(Number(job.expiryDays) || 7))),
    maxDownloads: Math.min(10000, Math.max(1, Math.round(Number(job.maxDownloads) || 5))),
    downloadCount: Math.max(0, Math.round(Number(job.downloadCount) || 0)),
    userId: auth.currentUser.uid,
    timestamp: serverTimestamp(),
    status: "completed" as const,
  };

  try {
    const jobRef = collection(db, "jobs");
    return await addDoc(jobRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "jobs");
  }
};

export const incrementJobDownloadCount = async (jobId: string, currentCount: number) => {
  if (!auth.currentUser) return;
  const path = `jobs/${jobId}`;
  try {
    await updateDoc(doc(db, "jobs", jobId), {
      downloadCount: Math.max(0, Math.round(currentCount)) + 1,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const addTransfer = async (transfer: {
  senderEmail: string;
  recipientEmail: string;
  fileName: string;
  downloadUrl: string;
}) => {
  if (!auth.currentUser) {
    throw new Error("Must be logged in to record a transfer.");
  }

  try {
    const transferRef = collection(db, "transfers");
    return await addDoc(transferRef, {
      senderEmail: (transfer.senderEmail || auth.currentUser.email || "").slice(0, 256),
      recipientEmail: transfer.recipientEmail.slice(0, 256),
      fileName: transfer.fileName.slice(0, 256),
      downloadUrl: transfer.downloadUrl.slice(0, 2048),
      userId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, "transfers");
  }
};

export const uploadFileToStorage = async (file: File): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error("Must be logged in to upload files.");
  }

  // Try Firebase Storage first with a short timeout
  try {
    const fileRef = ref(storage, `transfers/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
    const uploadPromise = uploadBytes(fileRef, file);

    const snapshot = (await Promise.race([
      uploadPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Storage upload timed out")), 4000)
      ),
    ])) as any;

    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (storageError) {
    console.warn("Firebase Storage unavailable, uploading to local app file store:", storageError);
  }

  // Real server-side file upload fallback so downloads always work
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Upload failed");
    throw new Error(`Failed to upload file: ${errText}`);
  }

  const data = await response.json();
  return data.url;
};
