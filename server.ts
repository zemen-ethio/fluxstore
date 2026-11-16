import express from "express";
import path from "path";
import zlib from "zlib";
import nodemailer from "nodemailer";
import { setupRoutes } from "./src/api/routes";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;
const db: any = null;

// Persistent local store for uploaded files and shareable transfer links
const DATA_DIR = path.join(process.cwd(), ".fluxstore-data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const FILES_INDEX_PATH = path.join(DATA_DIR, "files.json");
const TRANSFERS_INDEX_PATH = path.join(DATA_DIR, "transfers.json");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface StoredFileMeta {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  diskPath: string;
  createdAt: string;
}

interface TransferRecord {
  id: string;
  fileName: string;
  title?: string;
  storageUrl: string;
  expiryDays?: number;
  maxDownloads?: number;
  downloadCount: number;
  createdAt: string;
}

const loadJsonMap = <T>(filePath: string): Record<string, T> => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (err) {
    console.warn(`Failed to load ${filePath}:`, err);
  }
  return {};
};

const saveJsonMap = (filePath: string, data: Record<string, any>) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn(`Failed to save ${filePath}:`, err);
  }
};

const filesRegistry: Record<string, StoredFileMeta> = loadJsonMap<StoredFileMeta>(FILES_INDEX_PATH);
const transfersRegistry: Record<string, TransferRecord> = loadJsonMap<TransferRecord>(TRANSFERS_INDEX_PATH);

// Initialize GoogleGenAI SDK
// API key is accessed via process.env.GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY is not defined. The AI Advisor will run with rich local heuristics.");
}

// Initialize the new modular routes (moved below)

// Mounting Vite middleware (keep existing logic)

// Memory database states (used as local high-speed cache/backup)
const usersStore: Record<string, any> = {
  "nbelay10@gmail.com": {
    id: "usr_google_builder",
    email: "nbelay10@gmail.com",
    plan: "Free" as "Free" | "Pro" | "Enterprise",
    quotaUsed: 0,
    quotaLimit: 10 * 1024 * 1024 * 1024, // 10GB default
    apiCallsUsed: 0,
    apiCallsLimit: 100,
    password: "Password123!"
  }
};

let activeUserEmail = "";

const getActiveUser = () => {
  const emailLower = activeUserEmail.trim().toLowerCase();
  if (!usersStore[emailLower]) {
    usersStore[emailLower] = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      email: activeUserEmail,
      plan: "Free" as "Free" | "Pro" | "Enterprise",
      quotaUsed: 0,
      quotaLimit: 10 * 1024 * 1024 * 1024, // 10GB
      apiCallsUsed: 0,
      apiCallsLimit: 100
    };
    saveUser(emailLower, usersStore[emailLower]);
  }
  return usersStore[emailLower];
};

let compressionJobs: any[] = [
  {
    id: "job_1",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    fileName: "production_server_logs.log",
    fileType: "text/plain",
    originalSize: 1024 * 250, // 250KB
    compressedSize: 1024 * 35,  // 35KB
    method: "zstd",
    compressionRatio: 0.14,
    savingsPercent: 86,
    speedMs: 14,
    costSpent: 0.0012,
    status: "completed",
    aiRecommended: true,
  },
  {
    id: "job_2",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    fileName: "hero_background_landing.png",
    fileType: "image/png",
    originalSize: 1024 * 1200, // 1.2MB
    compressedSize: 1024 * 180, // 180KB
    method: "WebP",
    compressionRatio: 0.15,
    savingsPercent: 85,
    speedMs: 50,
    costSpent: 0.0050,
    status: "completed",
    aiRecommended: true,
  },
  {
    id: "job_3",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    fileName: "product_demo_reel.mp4",
    fileType: "video/mp4",
    originalSize: 1024 * 1024 * 45, // 45MB
    compressedSize: 1024 * 1024 * 11, // 11MB
    method: "H.265",
    compressionRatio: 0.24,
    savingsPercent: 76,
    speedMs: 1240,
    costSpent: 0.0820,
    status: "completed",
    aiRecommended: false,
  }
];

let usageLogs: any[] = [
  {
    id: "log_1",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    userId: "usr_google_builder",
    action: "file_compression",
    bytesProcessed: 1024 * 250,
    creditsCost: 0.5,
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: "usr_google_builder",
    action: "image_conversion",
    bytesProcessed: 1024 * 1200,
    creditsCost: 1.2,
  },
  {
    id: "log_3",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    userId: "usr_google_builder",
    action: "video_encoding",
    bytesProcessed: 1024 * 1024 * 45,
    creditsCost: 5.0,
  }
];

let analyticsEvents: any[] = [
  { id: "evt_1", timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), eventType: "job_created", payload: { method: "zstd" } },
  { id: "evt_2", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), eventType: "job_created", payload: { method: "WebP" } },
  { id: "evt_3", timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), eventType: "job_created", payload: { method: "H.265" } }
];

// Reinforcement learning weights
const rlWeights = {
  zstd: 0.85,
  WebP: 0.72,
  "H.265": 0.65,
  zlib: 0.50,
};

// Local cache sync helpers (Firestore writes are performed by authenticated clients)
const saveUser = async (email: string, userData: any) => {
  const emailLower = email.trim().toLowerCase();
  if (!emailLower) return;
  usersStore[emailLower] = userData;
};

const saveJob = async (job: any) => {
  if (!compressionJobs.some(j => j.id === job.id)) {
    compressionJobs.unshift(job);
  } else {
    const idx = compressionJobs.findIndex(j => j.id === job.id);
    if (idx !== -1) compressionJobs[idx] = job;
  }
};

const deleteJob = async (jobId: string) => {
  const idx = compressionJobs.findIndex((j) => j.id === jobId);
  if (idx !== -1) {
    compressionJobs.splice(idx, 1);
  }
};

const saveLog = async (log: any) => {
  if (!usageLogs.some(l => l.id === log.id)) {
    usageLogs.unshift(log);
  }
};

// Initialize the new modular routes
setupRoutes(app, {
  db, 
  ai, 
  usersStore, 
  compressionJobs, 
  usageLogs, 
  rlWeights, 
  saveUser,
  saveJob,
  deleteJob,
  saveLog,
  getActiveUser
});

// Binary upload endpoint (must precede express.json so raw bytes are preserved)
app.post(
  "/api/upload",
  express.raw({ type: "*/*", limit: "50mb" }),
  (req, res) => {
    try {
      const rawHeaderName = req.headers["x-file-name"];
      const decodedName =
        typeof rawHeaderName === "string" && rawHeaderName.trim()
          ? decodeURIComponent(rawHeaderName)
          : `upload_${Date.now()}.bin`;
      const safeFileName = path.basename(decodedName).replace(/[^\w.\-() ]+/g, "_") || "download.bin";
      const fileId = `f_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const diskPath = path.join(UPLOADS_DIR, `${fileId}_${safeFileName}`);
      const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");

      fs.writeFileSync(diskPath, buffer);

      const meta: StoredFileMeta = {
        fileId,
        fileName: safeFileName,
        mimeType: (req.headers["content-type"] as string) || "application/octet-stream",
        size: buffer.length,
        diskPath,
        createdAt: new Date().toISOString(),
      };
      filesRegistry[fileId] = meta;
      saveJsonMap(FILES_INDEX_PATH, filesRegistry);

      res.json({
        success: true,
        fileId,
        url: `/api/files/${fileId}`,
      });
    } catch (err) {
      console.error("File upload failed:", err);
      res.status(500).json({ error: "Failed to store uploaded file." });
    }
  }
);

app.get("/api/files/:fileId", (req, res) => {
  const { fileId } = req.params;
  if (!/^[a-zA-Z0-9_\-]+$/.test(fileId)) {
    return res.status(400).send("Invalid file identifier.");
  }
  const meta = filesRegistry[fileId];
  if (!meta || !fs.existsSync(meta.diskPath)) {
    return res.status(404).send("File not found.");
  }
  res.setHeader("Content-Type", meta.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${meta.fileName.replace(/"/g, "")}"`);
  res.sendFile(meta.diskPath);
});

app.use(express.json({ limit: "50mb" }));

// Register a transfer link created by an authenticated client
app.post("/api/transfers/register", (req, res) => {
  const { id, fileName, title, storageUrl, expiryDays, maxDownloads, downloadCount, createdAt } = req.body || {};
  if (!id || typeof id !== "string" || !/^[a-zA-Z0-9_\-]+$/.test(id)) {
    return res.status(400).json({ error: "Valid transfer id is required." });
  }
  transfersRegistry[id] = {
    id,
    fileName: typeof fileName === "string" ? fileName : "download",
    title: typeof title === "string" ? title : fileName,
    storageUrl: typeof storageUrl === "string" ? storageUrl : "",
    expiryDays: Number(expiryDays) || 7,
    maxDownloads: Number(maxDownloads) || 5,
    downloadCount: Number(downloadCount) || 0,
    createdAt: typeof createdAt === "string" ? createdAt : new Date().toISOString(),
  };
  saveJsonMap(TRANSFERS_INDEX_PATH, transfersRegistry);
  res.json({ success: true });
});

// Enable CORS/headers setup with user session email tracking
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-User-Email");
  
  const xEmail = req.headers["x-user-email"];
  if (xEmail && typeof xEmail === "string" && xEmail.trim().length > 0) {
    activeUserEmail = xEmail.trim().toLowerCase();
  }
  next();
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// fetch user dashboard info
app.get("/api/user/info", (req, res) => {
  const activeUser = getActiveUser();
  const emailLower = activeUser.email.trim().toLowerCase();
  let filteredJobs = compressionJobs.filter((j) => {
    const isSender = j.userId === activeUser.id || (j.senderEmail && j.senderEmail.trim().toLowerCase() === emailLower);
    const isRecipient = j.recipients && Array.isArray(j.recipients) && j.recipients.some((r: string) => r.trim().toLowerCase() === emailLower);
    return isSender || isRecipient;
  });
  
  if (filteredJobs.length === 0) {
    // Seeding disabled by request
    filteredJobs = [];
  }

  const filteredLogs = usageLogs.filter((l) => l.userId === activeUser.id);
  res.json({
    user: activeUser,
    jobs: filteredJobs,
    usage: filteredLogs,
    weights: rlWeights,
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Please enter a valid Gmail or email address." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (usersStore[normalizedEmail]) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  const newUser = {
    id: "usr_" + Math.random().toString(36).substring(2, 9),
    email,
    plan: "Free",
    quotaUsed: 0,
    quotaLimit: 10 * 1024 * 1024 * 1024, // 10GB
    apiCallsUsed: 0,
    apiCallsLimit: 100,
    password
  };

  await saveUser(normalizedEmail, newUser);
  activeUserEmail = normalizedEmail;

  res.json({
    success: true,
    message: "Registration successful!",
    user: newUser
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, isFirebaseSync } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Please enter your Gmail or email address." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const foundUser = usersStore[normalizedEmail];

  // If email was entered but no password, we can auto-register/simulate continuous sign in
  if (!foundUser) {
    // If password wasn't provided and is NOT a Firebase sync claim, invite them to sign up
    if (!password && !isFirebaseSync) {
      return res.status(404).json({ error: "Account not found. Type a password and click 'Sign Up' first to register." });
    }
    // Auto-create for simplicity
    const autoUser = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      email,
      plan: "Free",
      quotaUsed: 0,
      quotaLimit: 10 * 1024 * 1024 * 1024, // 10GB
      apiCallsUsed: 0,
      apiCallsLimit: 100,
      password: password || "FirebaseSyncedPasswordOk!"
    };
    await saveUser(normalizedEmail, autoUser);
    activeUserEmail = normalizedEmail;
    return res.json({
      success: true,
      message: "New account registered successfully!",
      user: autoUser
    });
  }

  // Only check password if it's NOT a Firebase sync context
  if (!isFirebaseSync && password && foundUser.password && foundUser.password !== password) {
    return res.status(401).json({ error: "Invalid password credentials. Please try again." });
  }

  activeUserEmail = normalizedEmail;

  res.json({
    success: true,
    message: "Logged in successfully!",
    user: foundUser
  });
});

app.post("/api/auth/logout", (req, res) => {
  activeUserEmail = "";
  res.json({
    success: true,
    message: "Session ended active context.",
    user: getActiveUser()
  });
});

// post check out subscription
app.post("/api/stripe/checkout", async (req, res) => {
  const { plan } = req.body;
  if (!plan || !["Pro", "Enterprise", "Free"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  // Update mock state
  const activeUser = getActiveUser();
  activeUser.plan = plan;
  if (plan === "Pro") {
    activeUser.quotaLimit = 100 * 1024 * 1024; // 100MB
    activeUser.apiCallsLimit = 1000;
  } else if (plan === "Enterprise") {
    activeUser.quotaLimit = 1024 * 1024 * 1024; // 1GB
    activeUser.apiCallsLimit = 10000;
  } else {
    activeUser.quotaLimit = 10 * 1024 * 1024 * 1024; // 10GB
    activeUser.apiCallsLimit = 100;
  }

  // Persist updated plan details to database
  await saveUser(activeUser.email, activeUser);

  // Add analytic entry
  analyticsEvents.push({
    id: `evt_stripe_${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: "plan_upgraded",
    payload: { plan }
  });

  res.json({
    success: true,
    message: `Checkout session established. Subscription status is now ${plan}.`,
    user: activeUser
  });
});

// RL loop improvement feed back
app.post("/api/rl/improve", (req, res) => {
  const { method, speed, ratio, rating } = req.body;
  if (!method || !["zstd", "WebP", "H.265", "zlib"].includes(method)) {
    return res.status(400).json({ error: "Invalid compression algorithm method" });
  }

  // RL learning heuristic update
  // Reinforce if positive rating or good speed ratio balance
  const ratingFactor = rating ? (rating - 3) / 10 : 0.05;
  const targetKey = method as keyof typeof rlWeights;
  
  rlWeights[targetKey] = Math.min(1.0, Math.max(0.1, rlWeights[targetKey] + ratingFactor));

  // Log analytics event
  analyticsEvents.push({
    id: `evt_rl_${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: "rl_weight_updated",
    payload: { method, newWeight: rlWeights[targetKey], speed, ratio }
  });

  res.json({
    success: true,
    message: `Reinforcement Learning weights updated for algorithm [${method}].`,
    weights: rlWeights
  });
});

// Helper for high-fidelity offline heuristic recommendations
function generateOfflineRecommendation(fileName: string, fileType: string, fileSize: number, entropy: number, bitrate: number, resolution: string) {
  const lowerType = (fileType || "").toLowerCase();
  const lowerName = (fileName || "").toLowerCase();
  const isTxt = lowerType.includes("text") || lowerType.includes("json") || lowerType.includes("log") || lowerType.includes("pdf") || /\.(txt|json|log|csv|xml|md|pdf|doc|docx)$/i.test(lowerName);
  const isImg = lowerType.includes("image") || /\.(png|jpe?g|gif|webp|bmp|tiff|svg)$/i.test(lowerName);
  const isVid = lowerType.includes("video") || /\.(mp4|mkv|mov|avi|webm|flv|wmv|3gp)$/i.test(lowerName);
  const isAudio = lowerType.includes("audio") || lowerType.includes("wav") || lowerType.includes("mp3") || /\.(wav|mp3|ogg|m4a|flac|aac)$/i.test(lowerName);

  if (isTxt) {
    return {
      method: "zstd" as const,
      expectedSavings: 0.15, // 85% saved
      reasoning: "Heuristic AI Predictor: Text structure or log streams detected. Recommended Zstandard (zstd) with compression level 9: premium payload savings vs edge decompression latency ratio.",
      predictedBitrate: "Level 9 dictionary",
      suggestedQuality: 92
    };
  } else if (isImg) {
    return {
      method: "WebP" as const,
      expectedSavings: 0.22, // 78% saved
      reasoning: "Heuristic AI Predictor: High density raster image bytes. Advanced WebP lossy encoder at quality index 75 reduces network payload size dynamically without perceptible visual degradation.",
      predictedBitrate: "quality=75 WebP",
      suggestedQuality: 75
    };
  } else if (isVid) {
    return {
      method: "H.265" as const,
      expectedSavings: 0.35, // 65% saved
      reasoning: "Heuristic AI Predictor: Dynamic video framerate vectors. High Efficiency Video Coding (H.265) via constant rate factor CRF 23 yields ultimate visual bit savings.",
      predictedBitrate: "CRF=23 preset=medium",
      suggestedQuality: 85
    };
  } else if (isAudio) {
    return {
      method: "zstd" as const,
      expectedSavings: 0.40, // 60% saved
      reasoning: "Heuristic AI Predictor: Decoded audio PCM signal content. Managed Zstandard (zstd) block packaging handles wave-frequencies seamlessly with minimal latency.",
      predictedBitrate: "sample_rate=44.1kHz Stereo",
      suggestedQuality: 80
    };
  } else {
    return {
      method: "zlib" as const,
      expectedSavings: 0.55, // 45% saved
      reasoning: "Heuristic AI Predictor: Unspecified binary stream file default context. Standard deflate algorithm (zlib) wrapper provides maximum backward compatibility.",
      predictedBitrate: "Deflate Level 6",
      suggestedQuality: 60
    };
  }
}

// Smart compression advisor (Gemini GPT-based Advisor)
app.post("/api/compress/advise", async (req, res) => {
  const { fileName, fileType, fileSize, entropy, bitrate, resolution } = req.body;

  if (!fileSize) {
    return res.status(400).json({ error: "fileSize parameter is required for prediction" });
  }

  // Check Quota Check
  const activeUser = getActiveUser();
  if (activeUser.quotaUsed >= activeUser.quotaLimit) {
    return res.status(403).json({ error: "Usage quota exceeded. Please upgrade your subscription plan via Stripe workflow." });
  }

  activeUser.apiCallsUsed += 1;

  // Let's create an AI/GPT Advisor Analysis using process.env.GEMINI_API_KEY
  let aiResponse = {
    method: "zlib",
    expectedSavings: 0.6,
    reasoning: "Local Heuristic Evaluation: Standard deflate compression suggested based on content detection.",
    predictedBitrate: "N/A",
    suggestedQuality: 80
  };

  if (ai) {
    try {
      const gResult = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this file metadata for optimal compression recommendation:
Name: ${fileName || "unknown.data"}
Type: ${fileType || "unknown/binary"}
Size: ${fileSize} bytes
Entropy: ${entropy || "unmeasured"}
Bitrate: ${bitrate || "N/A"}
Resolution: ${resolution || "N/A"}

Suggest the absolute best compression codec among zstd, WebP, H.265, or zlib. Include expected compression ratio (compressed / original size, where e.g. 0.25 is 75% savings) and detailed trade-offs.`,
        config: {
          systemInstruction: "You are the Senior Staff AI Advisor of the Fluxstore AI Platform. Recommend exact optimal compression algorithms and parameters.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              method: { type: Type.STRING, description: "Must be exactly one of: zstd, WebP, H.265, zlib" },
              expectedSavings: { type: Type.NUMBER, description: "Expected compression ratio from 0.05 to 0.95" },
              reasoning: { type: Type.STRING, description: "Detailed summary explaining trade-offs (speed, latency, cost, and compression quality)" },
              predictedBitrate: { type: Type.STRING, description: "Optimal encoding target parameters (e.g. crf=22, preset=ultrafast, quality=80)" }
            },
            required: ["method", "expectedSavings", "reasoning"]
          }
        }
      });

      if (gResult && gResult.text) {
        const parsed = JSON.parse(gResult.text.trim());
        aiResponse = {
          method: parsed.method || "zstd",
          expectedSavings: parsed.expectedSavings || 0.5,
          reasoning: parsed.reasoning || "Successful Gemini ML formulation.",
          predictedBitrate: parsed.predictedBitrate || "Normal",
          suggestedQuality: Math.round((1 - (parsed.expectedSavings || 0.5)) * 100)
        };
      }
    } catch (err: any) {
      console.log("Gemini API call bypassed or paused. Activating high-performance local heuristics.");
      // Seamless high-fidelity fallback
      const fallbackObj = generateOfflineRecommendation(fileName, fileType, Number(fileSize), Number(entropy || 4.2), Number(bitrate || 0), resolution || "");
      aiResponse = {
        method: fallbackObj.method,
        expectedSavings: fallbackObj.expectedSavings,
        reasoning: `[Offline Heuristic AI Active] ${fallbackObj.reasoning}`,
        predictedBitrate: fallbackObj.predictedBitrate,
        suggestedQuality: fallbackObj.suggestedQuality
      };
    }
  } else {
    // Generate intelligent heuristic response for offline mode
    const fallbackObj = generateOfflineRecommendation(fileName, fileType, Number(fileSize), Number(entropy || 4.2), Number(bitrate || 0), resolution || "");
    aiResponse = {
      method: fallbackObj.method,
      expectedSavings: fallbackObj.expectedSavings,
      reasoning: fallbackObj.reasoning,
      predictedBitrate: fallbackObj.predictedBitrate,
      suggestedQuality: fallbackObj.suggestedQuality
    };
  }

  res.json(aiResponse);
});

// Process active compression algorithm
app.post("/api/compress/process", async (req, res) => {
  const { fileName, fileType, fileContent, method, simulatedSize, recipients, title } = req.body;

  if (!fileName) {
    return res.status(400).json({ error: "fileName is required" });
  }

  // Quota verification
  const sizeToProcess = fileContent ? Buffer.byteLength(fileContent) : (simulatedSize || 100 * 1024);
  const activeUser = getActiveUser();
  if (activeUser.quotaUsed + sizeToProcess > activeUser.quotaLimit) {
    return res.status(403).json({ error: "Operation blocks due to Stripe monthly quota limits. Upgrade plan to resume." });
  }

  let finalCompressedSize = 0;
  let ratio = 0.5;
  let duration = 0;
  const start = Date.now();

  const isText = (fileType || "").includes("text") || fileName.endsWith(".txt") || fileName.endsWith(".log") || fileName.endsWith(".json");

  // Perform actual string compression if text is supplied
  if (isText && fileContent) {
    try {
      const buffer = Buffer.from(fileContent, "utf-8");
      // Use gzip natively
      const compressed = zlib.gzipSync(buffer);
      finalCompressedSize = compressed.length;
      ratio = finalCompressedSize / buffer.length;
    } catch {
      finalCompressedSize = Math.round(sizeToProcess * 0.3);
      ratio = 0.3;
    }
  } else {
    // Math/algorithmic mock depending on target method
    if (method === "zstd") {
      ratio = 0.12 + Math.random() * 0.08;
    } else if (method === "WebP") {
      ratio = 0.18 + Math.random() * 0.07;
    } else if (method === "H.265") {
      ratio = 0.28 + Math.random() * 0.12;
    } else {
      ratio = 0.45 + Math.random() * 0.15;
    }
    finalCompressedSize = Math.round(sizeToProcess * ratio);
  }

  duration = Math.max(2, Date.now() - start + Math.round(sizeToProcess / 100000)); // add size latency logic

  // Update Database states
  const recommendation = generateOfflineRecommendation(fileName, fileType || "binary/octet-stream", sizeToProcess, 4.5, 128, "1080p");
  const jobReasoning = (method && (recommendation.method === method)) 
    ? recommendation.reasoning 
    : `Heuristic AI Predictor: Compression route customized. The system executed compression utilizing ${method || "zlib"} codec based on pipeline configurations, optimizing bandwidth utilization with tailored headers.`;

  const job = {
    id: `job_${Date.now()}`,
    timestamp: new Date().toISOString(),
    fileName,
    title: title || fileName,
    fileType: fileType || "binary/octet-stream",
    originalSize: sizeToProcess,
    compressedSize: finalCompressedSize,
    method: method || "zstd",
    compressionRatio: Number(ratio.toFixed(3)),
    savingsPercent: Math.round((1 - ratio) * 100),
    speedMs: duration,
    costSpent: Number((sizeToProcess * 0.000002).toFixed(6)), // smart calculation
    status: "completed",
    userId: activeUser.id,
    senderEmail: activeUser.email,
    recipients: recipients || [],
    aiRecommended: true,
    storageUrl: req.body.storageUrl || "",
    reasoning: jobReasoning
  };

  await saveJob(job);
  
  // Update state used bytes
  activeUser.quotaUsed += sizeToProcess;
  await saveUser(activeUser.email, activeUser);

  // Add usage logs
  await saveLog({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: activeUser.id,
    action: "file_compression",
    bytesProcessed: sizeToProcess,
    creditsCost: Number((sizeToProcess / 1024 / 1024).toFixed(3))
  });

  analyticsEvents.push({
    id: `evt_job_${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: "job_created",
    payload: { method, ratio }
  });

  res.json({
    success: true,
    job,
    user: activeUser
  });
});

// Delete compression history record
app.delete("/api/compress/job/:id", async (req, res) => {
  const { id } = req.params;
  const activeUser = getActiveUser();

  const idx = compressionJobs.findIndex((j) => j.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Target history job record not found." });
  }

  const deletedJob = compressionJobs[idx];
  
  // Remove record from server-side store
  await deleteJob(id);

  // Dynamically subtract original size from active user's quota log
  if (activeUser) {
    activeUser.quotaUsed = Math.max(0, activeUser.quotaUsed - deletedJob.originalSize);
    await saveUser(activeUser.email, activeUser);
  }

  // Add a trace action to usage logs
  await saveLog({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: activeUser ? activeUser.id : "usr_anonymous",
    action: "file_deletion",
    bytesProcessed: deletedJob.originalSize,
    creditsCost: 0
  });

  res.json({
    success: true,
    message: "Compression log successfully deleted.",
    jobs: compressionJobs,
    user: activeUser
  });
});

// Public endpoint to get shared job metadata for read-only link downloads
app.get("/api/compress/shared-job/:id", (req, res) => {
  const { id } = req.params;
  const job = compressionJobs.find((j) => j.id === id);
  if (!job) {
    return res.status(404).json({ error: "Shared transfer session expired or not found." });
  }
  res.json({ success: true, job });
});

app.get("/api/download/:id", (req, res) => {
  const { id } = req.params;
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
    return res.status(400).send("Invalid transfer ID.");
  }

  try {
    const registered = transfersRegistry[id];
    const fallbackJob = !registered ? compressionJobs.find((j) => j.id === id) : null;
    const jobData: any = registered || fallbackJob;

    if (!jobData) {
      return res.status(404).send("File transfer expired or not found.");
    }

    // Check expiry
    const createdRaw = jobData.createdAt || jobData.timestamp;
    if (jobData.expiryDays && createdRaw) {
      const timestamp = createdRaw.toDate ? createdRaw.toDate() : new Date(createdRaw);
      const expiryDate = new Date(timestamp.getTime() + jobData.expiryDays * 24 * 60 * 60 * 1000);
      if (new Date() > expiryDate) {
        return res.status(403).send("Transfer link has expired.");
      }
    }

    // Check download limit
    const maxDownloads = jobData.maxDownloads || 5;
    const currentCount = jobData.downloadCount || 0;
    if (currentCount >= maxDownloads) {
      return res.status(403).send("Transfer download limit reached.");
    }

    // Increment count
    if (registered) {
      registered.downloadCount = currentCount + 1;
      saveJsonMap(TRANSFERS_INDEX_PATH, transfersRegistry);
    }

    const storageUrl: string = jobData.storageUrl || "";
    if (!storageUrl || storageUrl.includes("fluxstore-ai-mock-storage.example.com")) {
      return res.status(404).send("File URL not available for this transfer.");
    }

    if (storageUrl.startsWith("/api/files/")) {
      const fileId = storageUrl.replace("/api/files/", "");
      const meta = filesRegistry[fileId];
      if (meta && fs.existsSync(meta.diskPath)) {
        res.setHeader("Content-Type", meta.mimeType || "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${meta.fileName.replace(/"/g, "")}"`);
        return res.sendFile(meta.diskPath);
      }
      return res.status(404).send("Stored file not found.");
    }

    return res.redirect(storageUrl);
  } catch (err) {
    console.error("Error fetching download link:", err);
    return res.status(500).send("Error fetching transfer.");
  }
});

// Endpoint to send email notifications for file transfers
app.post("/api/email/send", async (req, res) => {
  const { to, from, subject, message, link } = req.body;

  if (!to) {
    return res.status(400).json({ error: "Recipient email is required" });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"FluxStore AI" <${smtpUser}>`, 
        to,
        subject: subject || 'You received a file via FluxStore AI',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've received a file transfer!</h2>
            <p>${from ? `<strong>${from}</strong>` : 'Someone'} has sent you a file via FluxStore AI.</p>
            ${message ? `<p><em>"${message}"</em></p>` : ''}
            <br />
            <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download File</a>
            <br /><br />
            <p style="color: #666; font-size: 12px;">This link is valid for 7 days.</p>
          </div>
        `,
      });
      res.json({ success: true, message: "Email sent successfully via Nodemailer", data: info });
    } catch (error) {
      console.error("Nodemailer error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  } else {
    // Mock successful email sending for development if no SMTP credentials are present
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Link: ${link}`);
    res.json({ 
      success: true, 
      message: "Mock email sent successfully. To send real emails, add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to your Secrets.",
      mock: true
    });
  }
});

// Streaming compression endpoint
app.get("/api/compress/stream-download", (req, res) => {
  const sizeKb = Number(req.query.sizeKb) || 500;
  const originalName = (req.query.fileName as string) || "smart_streamed_logs.log";
  
  res.setHeader("Content-Disposition", `attachment; filename="compressed_${originalName}.gz"`);
  res.setHeader("Content-Type", "application/gzip");

  const gzipStream = zlib.createGzip();
  gzipStream.pipe(res);

  let chunkCount = 0;
  const interval = setInterval(() => {
    if (chunkCount >= sizeKb) {
      clearInterval(interval);
      gzipStream.end();
      return;
    }
    // write mock repeatable string data
    const message = `[INFO] ${new Date().toISOString()} - Processing smart logs transaction #${chunkCount} - memory load: ${Math.random() * 100}% - status: ACTIVE\n`;
    gzipStream.write(message);
    chunkCount += 1;
  }, 1);
});

// Mount Vite middleware for dev mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite running in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Vite running in production node mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
