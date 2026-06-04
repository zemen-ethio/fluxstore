import express from "express";
import path from "path";
import zlib from "zlib";
import { Resend } from 'resend';
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, getDocFromServer } from "firebase/firestore";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Firebase
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const firebaseApp = initializeApp(config);
    db = getFirestore(firebaseApp);
    console.log("Firebase client initialized successfully.");
    
    // Test connection as instructed by skill guidelines (Disabled for now)
    /*
    getDocFromServer(doc(db, "test", "connection")).catch((error) => {
      if (error instanceof Error && error.message.includes("offline")) {
        console.error("Please check your Firebase configuration. Server offline.");
      }
    });
    */
  } else {
    console.warn("firebase-applet-config.json file not found. Running in offline/in-memory mode.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase:", err);
}

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

// Firestore integration sync helpers
const saveUser = async (email: string, userData: any) => {
  const emailLower = email.trim().toLowerCase();
  
  if (!emailLower) {
    console.warn("Skipping saveUser for empty email.");
    return;
  }

  usersStore[emailLower] = userData;
  if (db) {
    try {
      const userDocRef = doc(db, "users", emailLower);
      await setDoc(userDocRef, userData);
    } catch (err) {
      console.error("Firestore saveUser failed for path users/" + emailLower + ":", err);
    }
  }
};

const saveJob = async (job: any) => {
  // Prevent duplicate unshift
  if (!compressionJobs.some(j => j.id === job.id)) {
    compressionJobs.unshift(job);
  } else {
    // Update existing
    const idx = compressionJobs.findIndex(j => j.id === job.id);
    if (idx !== -1) compressionJobs[idx] = job;
  }
  if (db) {
    try {
      const jobDocRef = doc(db, "jobs", job.id);
      await setDoc(jobDocRef, job);
    } catch (err) {
      console.error("Firestore saveJob failed for path jobs/" + job.id + ":", err);
    }
  }
};

const deleteJob = async (jobId: string) => {
  const idx = compressionJobs.findIndex((j) => j.id === jobId);
  if (idx !== -1) {
    compressionJobs.splice(idx, 1);
  }
  if (db) {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
    } catch (err) {
      console.error("Firestore deleteJob failed:", err);
    }
  }
};

const saveLog = async (log: any) => {
  if (!usageLogs.some(l => l.id === log.id)) {
    usageLogs.unshift(log);
  }
  if (db) {
    try {
      const logDocRef = doc(db, "logs", log.id);
      await setDoc(logDocRef, log);
    } catch (err) {
      console.error("Firestore saveLog failed for path logs/" + log.id + ":", err);
    }
  }
};

// Synchronization routine on server boot
async function startFirestoreSync() {
  if (!db) return;
  try {
    console.log("Synchronizing Firestore collections...");
    
    // 1. Sync users
    const usersSnap = await getDocs(collection(db, "users"));
    if (usersSnap.size > 0) {
      usersSnap.forEach((docSnap) => {
        usersStore[docSnap.id] = docSnap.data();
      });
      console.log(`Synced ${usersSnap.size} user profiles from Firestore.`);
    } else {
      for (const [email, user] of Object.entries(usersStore)) {
        await setDoc(doc(db, "users", email), user);
      }
      console.log("Seeded initial users into Firestore.");
    }

    // 2. Sync compression jobs
    const jobsSnap = await getDocs(collection(db, "jobs"));
    if (jobsSnap.size > 0) {
      const dbJobs: any[] = [];
      jobsSnap.forEach((docSnap) => {
        dbJobs.push(docSnap.data());
      });
      dbJobs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      compressionJobs = dbJobs;
      console.log(`Synced ${dbJobs.length} jobs from Firestore.`);
    } else {
      for (const job of compressionJobs) {
        await setDoc(doc(db, "jobs", job.id), job);
      }
      console.log("Seeded initial jobs into Firestore.");
    }

    // 3. Sync logs
    const logsSnap = await getDocs(collection(db, "logs"));
    if (logsSnap.size > 0) {
      const dbLogs: any[] = [];
      logsSnap.forEach((docSnap) => {
        dbLogs.push(docSnap.data());
      });
      dbLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      usageLogs = dbLogs;
      console.log(`Synced ${dbLogs.length} usage logs from Firestore.`);
    } else {
      for (const log of usageLogs) {
        await setDoc(doc(db, "logs", log.id), log);
      }
      console.log("Seeded initial logs into Firestore.");
    }
  } catch (err) {
    console.error("Firestore startup sync failed:", err);
  }
}

// Trigger background synchronization
startFirestoreSync();

app.use(express.json({ limit: "50mb" }));

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

app.post("/api/send-email", async (req, res) => {
  const { to, subject, link, sender, fileName, fileSize } = req.body;
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Email service not configured (Resend API Key missing)" });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: to,
      replyTo: sender,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <p><strong>Recipients:</strong> ${Array.isArray(to) ? to.join(", ") : to}</p>
          <p><strong>Download link:</strong> <a href="${link}">${link}</a></p>
          <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;">
          <p><strong>1 item</strong></p>
          <p>${fileName || "File"} (${fileSize ? (fileSize / 1024).toFixed(1) + " KB" : "Unknown size"})</p>
        </div>
      `,
    });

    console.log("Resend API response:", { data, error });

    if (error) {
      console.error("Resend API error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error("Email sending failed:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
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
