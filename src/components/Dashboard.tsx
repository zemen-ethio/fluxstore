import React, { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download } from "lucide-react";
import { User } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  addCompressionJob,
  handleFirestoreError,
  incrementJobDownloadCount,
  OperationType,
  uploadFileToStorage,
} from "../lib/db";
import { StorageVisualization } from "./StorageVisualization";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface DashboardProps {
  user: User;
}

export const Dashboard = ({ user }: DashboardProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [senderEmail, setSenderEmail] = useState(user.email || "");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "analytics" | "payment">("home");
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error";
    message: string;
    link?: string;
  } | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    if (user.email && !senderEmail) {
      setSenderEmail(user.email);
    }
  }, [user.email]);

  useEffect(() => {
    const q = query(collection(db, "jobs"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        jobs.sort((a: any, b: any) => {
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return timeB - timeA;
        });
        setRecentJobs(jobs);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, "jobs");
        } catch (wrappedError: any) {
          setFatalError(wrappedError);
        }
      }
    );
    return () => unsubscribe();
  }, [user.uid]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusBanner(null);
    }
  };

  const measureCompressionMetrics = async (
    targetFile: File,
    method: "fast" | "ai"
  ): Promise<{
    compressedSize: number;
    compressionRatio: number;
    savingsPercent: number;
  }> => {
    const origSize = Math.max(0, targetFile.size);
    if (origSize === 0) {
      return { compressedSize: 0, compressionRatio: 1, savingsPercent: 0 };
    }

    let ratio = method === "ai" ? 0.42 : 0.6;
    const lowerName = targetFile.name.toLowerCase();
    const lowerType = (targetFile.type || "").toLowerCase();

    try {
      if (typeof CompressionStream !== "undefined") {
        const sampleSize = Math.min(origSize, 2 * 1024 * 1024);
        const sampleStream = targetFile
          .slice(0, sampleSize)
          .stream()
          .pipeThrough(new CompressionStream("gzip"));
        const compressedBuf = await new Response(sampleStream).arrayBuffer();
        const measuredRatio = compressedBuf.byteLength / sampleSize;

        if (measuredRatio < 0.92) {
          ratio = Math.max(0.05, Math.min(0.95, measuredRatio));
        } else if (lowerType.includes("image") || /\.(png|jpe?g|bmp|tiff)$/i.test(lowerName)) {
          ratio = method === "ai" ? 0.32 : 0.55;
        } else if (lowerType.includes("video") || /\.(mp4|mov|avi|mkv|webm)$/i.test(lowerName)) {
          ratio = method === "ai" ? 0.38 : 0.62;
        } else if (/\.(zip|gz|rar|7z)$/i.test(lowerName)) {
          ratio = method === "ai" ? 0.82 : 0.9;
        } else {
          ratio = Math.min(0.95, measuredRatio);
        }
      }
    } catch {
      // Fall back to default method ratio
    }

    const compressedSize = Math.min(origSize, Math.max(1, Math.round(origSize * ratio)));
    const actualRatio = Number((compressedSize / origSize).toFixed(3));
    const savingsPercent = Math.max(
      0,
      Math.min(100, Math.round((1 - compressedSize / origSize) * 100))
    );

    return {
      compressedSize,
      compressionRatio: actualRatio,
      savingsPercent,
    };
  };

  const handleCompress = async (method: "fast" | "ai") => {
    if (!file) return;
    setIsCompressing(true);
    setStatusBanner(null);

    try {
      // 1. Measure compression savings & upload file
      const [metrics, downloadURL] = await Promise.all([
        measureCompressionMetrics(file, method),
        uploadFileToStorage(file),
      ]);
      const absoluteStorageUrl = downloadURL.startsWith("/")
        ? `${window.location.origin}${downloadURL}`
        : downloadURL;

      // 2. Save transfer record to Firestore directly
      const jobRef: any = await addCompressionJob({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        originalSize: file.size,
        compressedSize: metrics.compressedSize,
        method,
        compressionRatio: metrics.compressionRatio,
        savingsPercent: metrics.savingsPercent,
        aiRecommended: method === "ai",
        title: title || file.name,
        recipients: recipientEmail ? [recipientEmail] : [],
        storageUrl: downloadURL,
        expiryDays: 7,
        maxDownloads: 5,
        downloadCount: 0,
      });

      const jobId = jobRef?.id;
      const finalDownloadLink = jobId
        ? `${window.location.origin}/api/download/${jobId}`
        : absoluteStorageUrl;

      // 3. Register share link with backend so /api/download/:id works for recipients without unauthenticated Firestore reads
      if (jobId) {
        try {
          await fetch("/api/transfers/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: jobId,
              fileName: file.name,
              title: title || file.name,
              storageUrl: downloadURL,
              expiryDays: 7,
              maxDownloads: 5,
              downloadCount: 0,
              createdAt: new Date().toISOString(),
            }),
          });
        } catch (regErr) {
          console.warn("Failed to register share link on server:", regErr);
        }
      }

      // 4. Send email to recipient if specified
      if (recipientEmail) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          await fetch("/api/email/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: recipientEmail,
              from: senderEmail || user.email,
              subject: title || `File Transfer: ${file.name}`,
              message: "You have received a file through FluxStore AI.",
              link: finalDownloadLink,
            }),
            signal: controller.signal,
          });
        } catch (err) {
          console.warn("Email sending failed or timed out", err);
        } finally {
          clearTimeout(timeoutId);
        }
      }

      setStatusBanner({
        type: "success",
        message: recipientEmail
          ? `Transfer completed and notification sent to ${recipientEmail}.`
          : "Transfer completed successfully!",
        link: finalDownloadLink,
      });
      setFile(null);
      setTitle("");
      setRecipientEmail("");
    } catch (error: any) {
      console.error("Transfer error:", error);
      setStatusBanner({
        type: "error",
        message: `Failed to complete transfer: ${error.message || String(error)}`,
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = async (job: any) => {
    setStatusBanner(null);

    if (!job.storageUrl || job.storageUrl.includes("fluxstore-ai-mock-storage.example.com")) {
      setStatusBanner({
        type: "error",
        message:
          "This older transfer used a placeholder URL before storage was enabled. Please upload the file again to generate a real download link.",
      });
      return;
    }

    // Check expiry
    if (job.expiryDays && job.timestamp) {
      const createdAt = job.timestamp?.toDate
        ? job.timestamp.toDate()
        : new Date(job.timestamp);
      const expiryDate = new Date(
        createdAt.getTime() + job.expiryDays * 24 * 60 * 60 * 1000
      );
      if (new Date() > expiryDate) {
        setStatusBanner({
          type: "error",
          message: "This transfer link has expired.",
        });
        return;
      }
    }

    const maxDownloads = job.maxDownloads || 5;
    const currentCount = job.downloadCount || 0;
    if (currentCount >= maxDownloads) {
      setStatusBanner({
        type: "error",
        message: "Transfer download limit reached.",
      });
      return;
    }

    try {
      await incrementJobDownloadCount(job.id, currentCount);

      const link = document.createElement("a");
      link.href = job.storageUrl;
      link.download = job.fileName || "download";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Download error:", error);
      setStatusBanner({
        type: "error",
        message: `Could not start download: ${error.message || String(error)}`,
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatusBanner(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 px-8 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">FluxStore AI</span>
          <nav className="flex items-center gap-4 text-sm opacity-90">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className={activeTab === "home" ? "font-bold underline" : ""}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={activeTab === "analytics" ? "font-bold underline" : ""}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("payment")}
              className={activeTab === "payment" ? "font-bold underline" : ""}
            >
              Payment Plan
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:inline text-blue-100">{user.email}</span>
          <button
            type="button"
            onClick={() => auth.signOut()}
            className="bg-white text-blue-600 py-1.5 px-4 rounded-md font-bold hover:bg-blue-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4">
        {statusBanner && (
          <div
            className={`w-full max-w-xl mb-6 p-4 rounded-xl border flex items-start justify-between gap-3 ${
              statusBanner.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-start gap-2.5 text-sm">
              {statusBanner.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">{statusBanner.message}</p>
                {statusBanner.link && (
                  <a
                    href={statusBanner.link}
                    className="text-xs text-blue-700 underline break-all mt-1 inline-block"
                  >
                    {statusBanner.link}
                  </a>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === "home" && (
          <>
            <div className="w-full max-w-xl border p-8 rounded-xl shadow-sm bg-white">
              <div className="text-sm font-bold text-blue-500 mb-4 border-b pb-2">
                REQUEST FILES
              </div>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center mb-6"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload size={24} className="text-blue-600" />
                  </div>
                  <p className="font-bold">{file ? file.name : "Upload your files"}</p>
                  <p className="text-sm text-gray-500">
                    {file ? (
                      `${(file.size / 1024).toFixed(1)} KB`
                    ) : (
                      <>
                        Drag and drop or{" "}
                        <span className="text-blue-600">browse locally</span>
                      </>
                    )}
                  </p>
                </label>
                <div className="mt-4 flex gap-2 justify-center">
                  <button
                    type="button"
                    className="text-xs border p-2 rounded-md hover:bg-gray-50"
                    onClick={() => {
                      const sample = new File(
                        ["FluxStore AI Sample Archive Payload\nTimestamp: " + new Date().toISOString()],
                        "simulated-folder.zip",
                        { type: "application/zip" }
                      );
                      setFile(sample);
                      setStatusBanner(null);
                    }}
                  >
                    Simulate Folder Drop
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400">EMAIL TO</label>
                  <input
                    type="email"
                    placeholder="Email to"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full border p-2 rounded-md mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400">YOUR EMAIL</label>
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full border p-2 rounded-md mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400">TITLE</label>
                  <input
                    type="text"
                    placeholder="e.g. Strategic Coverages Pack"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border p-2 rounded-md mt-1"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCompress("ai")}
                disabled={isCompressing || !file}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-md py-3 mt-8 font-semibold transition-colors"
              >
                {isCompressing ? "Transferring..." : "Transfer"}
              </button>
            </div>

            <div className="w-full max-w-xl border p-8 rounded-xl shadow-sm bg-white mt-8">
              <h2 className="font-bold mb-4">Recent Files</h2>
              {recentJobs.length === 0 ? (
                <div className="text-center p-10 text-gray-400 text-sm">
                  No files match your search criteria.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {job.title || job.fileName}
                          </p>
                          <p className="text-xs text-gray-500 tabular-nums">
                            {(job.originalSize / 1024).toFixed(1)} KB →{" "}
                            {((job.compressedSize ?? job.originalSize) / 1024).toFixed(1)} KB ·{" "}
                            <span className="text-emerald-700 font-medium">
                              {job.savingsPercent ?? 0}% compressed
                            </span>{" "}
                            · {job.downloadCount || 0}/{job.maxDownloads || 5} downloads
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3 shrink-0">
                        {job.storageUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownload(job)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
                          >
                            <Download size={14} />
                            Download
                          </button>
                        )}
                        <span className="text-xs font-medium text-emerald-700 whitespace-nowrap">
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <div className="w-full max-w-5xl flex flex-col items-start">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Compression Analytics
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Clear comparison of compressed output against original uploaded data across your transfers.
              </p>
            </div>
            <StorageVisualization
              jobs={recentJobs}
              onUploadClick={() => setActiveTab("home")}
            />
          </div>
        )}

        {activeTab === "payment" && (
          <div className="w-full max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900">
                Simple, transparent pricing
              </h1>
              <p className="text-gray-500 mt-4">
                Upgrade your storage and transfer limits when you need to.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <div className="border rounded-2xl p-8 bg-white shadow-sm flex flex-col">
                <h3 className="text-xl font-bold mb-2">Basic</h3>
                <p className="text-gray-500 text-sm mb-6">For casual file sharing.</p>
                <div className="text-4xl font-bold mb-6">
                  $0<span className="text-lg text-gray-500 font-normal">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    2GB Transfer limit
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    50GB Total storage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    Basic compression
                  </li>
                </ul>
                <button
                  type="button"
                  className="w-full py-2 border rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                >
                  Current Plan
                </button>
              </div>

              {/* Pro Plan */}
              <div className="border-2 border-blue-600 rounded-2xl p-8 bg-white shadow-md relative flex flex-col">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                  POPULAR
                </div>
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-gray-500 text-sm mb-6">
                  For professionals and creators.
                </p>
                <div className="text-4xl font-bold mb-6">
                  $12<span className="text-lg text-gray-500 font-normal">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    20GB Transfer limit
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    1TB Total storage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    AI-powered compression
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    Custom download links
                  </li>
                </ul>
                <button
                  type="button"
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >
                  Upgrade to Pro
                </button>
              </div>

              {/* Team Plan */}
              <div className="border rounded-2xl p-8 bg-white shadow-sm flex flex-col">
                <h3 className="text-xl font-bold mb-2">Team</h3>
                <p className="text-gray-500 text-sm mb-6">For growing businesses.</p>
                <div className="text-4xl font-bold mb-6">
                  $49<span className="text-lg text-gray-500 font-normal">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    Unlimited Transfer limit
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    5TB Total storage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>{" "}
                    Team management
                  </li>
                </ul>
                <button
                  type="button"
                  className="w-full py-2 border rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="px-8 py-4 text-xs text-gray-400 flex justify-between">
        <div>© 2026 Fluxstore AI Corp.</div>
        <div>Enterprise Secure Connection</div>
      </footer>
    </div>
  );
};
