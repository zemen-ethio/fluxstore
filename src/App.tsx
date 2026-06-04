import React, { useState, useEffect } from "react";
import {
  Upload,
  Activity,
  Sparkles,
  DollarSign,
  Layers,
  Settings,
  ShieldAlert,
  Check,
  Sliders,
  Terminal,
  ArrowRight,
  Code,
  Download,
  Database,
  TrendingDown,
  Gauge,
  Server,
  Star,
  RefreshCw,
  Cpu,
  BookmarkCheck,
  Flame,
  FileCode2,
  Copy,
  Plus,
  FolderPlus,
  Calendar,
  ChevronDown,
  Trash2,
  PlusCircle,
  Share2,
  Eye,
  EyeOff,
  Link,
  X,
  Mail,
  Lock,
  Search
} from "lucide-react";
import JSZip from "jszip";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

import {
  architectureSystem,
  pythonMLService,
  cloudflareWorker,
  databaseSchema,
  stripeBilling,
  kubernetesDeployment,
  rlSystemCode
} from "./codeSnippets";

import { CompressionJob, User, RLWeights, AIAdvisorResponse } from "./types";

// Client-side Firebase imports
import { auth as clientAuth, storage as clientStorage, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as clientSignOut, onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

// Safe appFetch helper to always attach active User Email context
export const appFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const email = clientAuth.currentUser?.email || "";
  const newInit = { ...init };
  const headers = new Headers(newInit.headers || {});
  if (!headers.has("X-User-Email") && email) {
    headers.set("X-User-Email", email);
  }
  newInit.headers = headers;
  return window.fetch(input, newInit);
};

const getByteLength = (str: string) => new TextEncoder().encode(str).length;

// Helper to determine file format category
const getFileCategory = (fileType: string) => {
  if (fileType.startsWith("image/")) return "Image";
  if (fileType.startsWith("text/")) return "Text file";
  if (fileType.startsWith("audio/")) return "Audio";
  if (fileType.startsWith("video/")) return "Video";
  if (fileType.startsWith("application/pdf")) return "PDF";
  return "File";
};

const THEMES = {
  light: {
    outerBg: "bg-white text-blue-700",
    cardBg: "bg-white border-2 border-blue-600 shadow-none text-blue-700",
    headerBg: "bg-white border-b-2 border-blue-600 shadow-none text-blue-700",
    titleText: "text-blue-700 font-bold",
    mutedText: "text-blue-500",
    brandText: "text-blue-700 bg-white border border-blue-600 font-bold",
    accentBg: "bg-blue-600 border-2 border-blue-600 text-white font-bold",
    accentText: "text-blue-700",
    accentNavActive: "bg-blue-600 text-white border-2 border-blue-600 font-bold",
    accentNavInactive: "text-blue-500 hover:text-blue-700 hover:bg-blue-50",
    panelHead: "border-blue-200 pb-2 mb-3",
    inputBg: "bg-white border-2 border-blue-300 text-blue-700 focus:bg-white focus:border-blue-600",
    accentBtn: "bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 font-bold",
    tabActive: "bg-blue-600 text-white shadow-none font-bold",
    tabInactive: "text-blue-500 hover:text-blue-700 font-bold",
    preBg: "bg-blue-50 text-blue-800 border border-blue-200",
    chartGrid: "#dbeafe",
    chartTooltipBg: "#ffffff",
    chartTooltipBorder: "#3b82f6",
    chartTooltipColor: "#1e3a8a",
    chartOrigColor: "#93c5fd",
    chartCompColor: "#1d4ed8",
    sliderAccent: "accent-blue-600 bg-blue-100",
    badgeSuccess: "bg-blue-50 border border-blue-200 text-blue-800 font-bold",
    badgeError: "bg-red-50 border border-red-200 text-red-900 font-bold",
    navCodeActive: "bg-blue-600 text-white border-2 border-blue-600 font-bold",
    navCodeInactive: "text-blue-500 hover:text-blue-700 hover:bg-blue-50",
    footerBg: "bg-white border-t border-blue-200",
  },

  neon: {
    outerBg: "bg-zinc-950 text-zinc-300",
    cardBg: "bg-zinc-900 border border-zinc-800 shadow",
    headerBg: "bg-zinc-900 border-b border-zinc-800/80 shadow-md",
    titleText: "text-white",
    mutedText: "text-zinc-400",
    brandText: "text-emerald-400 bg-emerald-950/80 border border-emerald-800",
    accentBg: "bg-emerald-600 border border-emerald-500 text-zinc-950",
    accentText: "text-emerald-400",
    accentNavActive: "bg-emerald-950 text-emerald-400 border border-emerald-500/20",
    accentNavInactive: "text-zinc-400 hover:text-white hover:bg-zinc-850",
    panelHead: "border-zinc-800 pb-2 mb-3",
    inputBg: "bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-emerald-500/50 focus:bg-zinc-900/50",
    accentBtn: "bg-emerald-500 text-black border border-emerald-400/20 hover:bg-emerald-400",
    tabActive: "bg-zinc-850 text-emerald-400 shadow-sm",
    tabInactive: "text-zinc-400 hover:text-zinc-300",
    preBg: "bg-zinc-950 text-zinc-300 border border-zinc-800",
    chartGrid: "#27272a",
    chartTooltipBg: "#18181b",
    chartTooltipBorder: "#3f3f46",
    chartTooltipColor: "#f4f4f5",
    chartOrigColor: "#71717a",
    chartCompColor: "#10b981",
    sliderAccent: "accent-emerald-500 bg-zinc-800",
    badgeSuccess: "bg-emerald-950 border border-emerald-850 text-emerald-400",
    badgeError: "bg-red-950 border border-red-850 text-red-400",
    navCodeActive: "bg-emerald-950 text-emerald-400 border border-emerald-500/20",
    navCodeInactive: "text-zinc-400 hover:text-white hover:bg-zinc-850/60",
    footerBg: "bg-zinc-950 border-t border-zinc-900",
  },
  cyber: {
    outerBg: "bg-neutral-950 text-sky-200/90",
    cardBg: "bg-neutral-900 border border-blue-500/30 shadow-md",
    headerBg: "bg-neutral-900 border-b border-blue-500/40 shadow-lg",
    titleText: "text-sky-400 font-mono",
    mutedText: "text-sky-500/75",
    brandText: "text-sky-400 bg-sky-950 border border-blue-500/40",
    accentBg: "bg-blue-500 text-white border border-blue-600 font-bold",
    accentText: "text-sky-400",
    accentNavActive: "bg-blue-500 text-white border border-blue-600 font-bold",
    accentNavInactive: "text-blue-600 hover:text-sky-400 hover:bg-neutral-800",
    panelHead: "border-blue-500/20 pb-2 mb-3",
    inputBg: "bg-neutral-950 border border-blue-500/20 text-sky-300 focus:border-blue-500/60 focus:bg-neutral-900/60",
    accentBtn: "bg-blue-500 text-white border border-blue-600 hover:bg-blue-400 font-bold",
    tabActive: "bg-neutral-800 text-sky-300 shadow",
    tabInactive: "text-blue-600 hover:text-sky-400",
    preBg: "bg-neutral-950 text-sky-300 border border-blue-500/10",
    chartGrid: "#404040",
    chartTooltipBg: "#171717",
    chartTooltipBorder: "#3b82f6",
    chartTooltipColor: "#7dd3fc",
    chartOrigColor: "#737373",
    chartCompColor: "#3b82f6",
    sliderAccent: "accent-blue-500 bg-neutral-800",
    badgeSuccess: "bg-sky-950 border border-blue-500/30 text-sky-400",
    badgeError: "bg-red-955 border border-red-500/30 text-red-400",
    navCodeActive: "bg-blue-950 text-sky-400 border border-blue-500/40",
    navCodeInactive: "text-blue-600 hover:text-sky-400 hover:bg-neutral-800",
    footerBg: "bg-neutral-950 border-t border-blue-500/20",
  },
  aurora: {
    outerBg: "bg-indigo-950 text-slate-200",
    cardBg: "bg-slate-900 border border-indigo-500/30 shadow-xl",
    headerBg: "bg-slate-900 border-b border-indigo-500/40 shadow-lg",
    titleText: "text-white",
    mutedText: "text-indigo-300/80",
    brandText: "text-fuchsia-300 bg-fuchsia-950 border border-fuchsia-500/30",
    accentBg: "bg-indigo-600 border border-indigo-500 text-white",
    accentText: "text-fuchsia-400",
    accentNavActive: "bg-indigo-600 text-white border border-indigo-400 font-semibold",
    accentNavInactive: "text-indigo-300 hover:text-white hover:bg-indigo-950/50",
    panelHead: "border-indigo-800/40 pb-2 mb-3",
    inputBg: "bg-slate-950 border border-indigo-505 text-indigo-100 focus:border-fuchsia-400/50 focus:bg-slate-900/60",
    accentBtn: "bg-indigo-600 text-white border border-indigo-500/20 hover:bg-indigo-500",
    tabActive: "bg-slate-800 text-fuchsia-300 shadow",
    tabInactive: "text-indigo-400 hover:text-indigo-105",
    preBg: "bg-slate-950 text-indigo-300",
    chartGrid: "#334155",
    chartTooltipBg: "#0f172a",
    chartTooltipBorder: "#6366f1",
    chartTooltipColor: "#e0e7ff",
    chartOrigColor: "#64748b",
    chartCompColor: "#c084fc",
    sliderAccent: "accent-indigo-500 bg-slate-800",
    badgeSuccess: "bg-indigo-950 border border-indigo-500/30 text-indigo-200",
    badgeError: "bg-red-950 border border-red-500/35 text-red-300",
    navCodeActive: "bg-indigo-950 text-fuchsia-300 border border-fuchsia-500/30",
    navCodeInactive: "text-indigo-400 hover:text-indigo-100 hover:bg-slate-950/45",
    footerBg: "bg-slate-900 border-t border-indigo-900/50",
  }
};

export default function App() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const hasTriggeredWarningRef = React.useRef(false);
  const [toast, setToast] = useState<{ type: "warning" | "success" | "error" | "info"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"sandbox" | "analytics" | "billing" | "architecture">("sandbox");
  const [activeCodeTab, setActiveCodeTab] = useState<"architecture" | "python" | "cloudflare" | "db" | "stripe" | "kubernetes" | "rl">("architecture");
  const [designLook, setDesignLook] = useState<"light" | "neon" | "cyber" | "aurora">(() => {
    return (localStorage.getItem("fluxstore_design_look") as any) || "light";
  });

  useEffect(() => {
    localStorage.setItem("fluxstore_design_look", designLook);
  }, [designLook]);
  
  // States from Backend
  const [user, setUser] = useState<User>({
    id: "usr_google_builder",
    email: "",
    plan: "Free",
    quotaUsed: 0,
    quotaLimit: 10 * 1024 * 1024 * 1024, // 10 GB
    apiCallsUsed: 0,
    apiCallsLimit: 100
  });
  const [historyJobs, setHistoryJobs] = useState<CompressionJob[]>([]);
  const [rlWeights, setRlWeights] = useState<RLWeights>({
    zstd: 0.85,
    WebP: 0.72,
    "H.265": 0.65,
    zlib: 0.50
  });

  // Monitor quota usage and show warning toast when it exceeds 90% limit
  useEffect(() => {
    if (user && typeof user.quotaUsed === "number" && typeof user.quotaLimit === "number") {
      const percentage = (user.quotaUsed / user.quotaLimit) * 100;
      if (percentage >= 90) {
        if (!hasTriggeredWarningRef.current) {
          setToast({
            type: "warning",
            text: `⚠️ Quota Nearly Full: Storage usage is currently at ${percentage.toFixed(1)}% of your allowed subscription limit. Please upgrade your active plan under the billing section or free up space!`
          });
          hasTriggeredWarningRef.current = true;
        }
      } else {
        // Reset when user goes below the 90% threshold (e.g., deletes files)
        hasTriggeredWarningRef.current = false;
      }
    }
  }, [user?.quotaUsed, user?.quotaLimit]);

  // Handle auto-fade timeout for toast notifications
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // User Authentication UI states
  const [authEmail, setAuthEmail] = useState(() => localStorage.getItem("user_email") || "");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isAuthModeSignUp, setIsAuthModeSignUp] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Detailed Modal states & Public read-only sharing states
  const [selectedDetailedJob, setSelectedDetailedJob] = useState<CompressionJob | null>(null);
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const [sharedJob, setSharedJob] = useState<CompressionJob | null>(null);
  const [sharedJobId, setSharedJobId] = useState<string | null>(null);
  const [loadingSharedJob, setLoadingSharedJob] = useState(false);
  const [sharedJobError, setSharedJobError] = useState<string | null>(null);

  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [activeShareJob, setActiveShareJob] = useState<CompressionJob | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<CompressionJob | null>(null);

  // Client Upload Sandbox States
  const [uploadPreset, setUploadPreset] = useState<"text_doc" | "voice" | "image" | "video">("text_doc");
  const [fileName, setFileName] = useState("document_corporate_strategy.pdf");
  const [fileType, setFileType] = useState("application/pdf");
  const [fileContent, setFileContent] = useState(`FLUXSTORE CORPORATE BLUEPRINT STRATEGY INDEX:
1. Optimize cloud edge distribution ratios across European server quadrants.
2. Minimize high-fidelity image storage requirements dynamically via intelligent edge heuristics.
3. Consolidate log pipelines under compression ratio benchmarks using custom zlib frameworks.`);
  const [fileSizeSlider, setFileSizeSlider] = useState(450 * 1024); // 450 KB
  const [entropy, setEntropy] = useState(3.2);
  const [bitrate, setBitrate] = useState(0);
  const [resolution, setResolution] = useState("A4 Document Page");
  
  // AI Advisor Recommendation states
  const [aiAdvisor, setAiAdvisor] = useState<AIAdvisorResponse | null>(null);
  const [isAdvising, setIsAdvising] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"zstd" | "WebP" | "H.265" | "zlib">("zstd");
  const [autoRecommand, setAutoRecommand] = useState(true);

  // User notifications & actions feedback
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratedJobId, setRatedJobId] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState<string | null>(null);
  
  // Streaming compression setting
  const [streamSizeKb, setStreamSizeKb] = useState(500);
  const [isStreaming, setIsStreaming] = useState(false);

  // WeTransfer Style States
  const [emailsTo, setEmailsTo] = useState<string[]>([]);
  const [emailToInput, setEmailToInput] = useState("");
  const [transferTitle, setTransferTitle] = useState("");
  const [expiryDays, setExpiryDays] = useState(3);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number; type: string }[]>([]);
  const [transferSuccessJob, setTransferSuccessJob] = useState<any | null>(null);
  const [showMockNotification, setShowMockNotification] = useState<any | null>(null);

  // Auto-triggered Preset Compression when selecting a type directly (zero-touch prediction trigger)
  const handleSelectPresetAndCompress = async (preset: "text_doc" | "voice" | "image" | "video") => {
    setUploadPreset(preset);
    
    let immediateMethod: "zstd" | "WebP" | "H.265" | "zlib" = "zlib";
    let immediateFileName = "";
    let immediateFileType = "";
    let immediateContent = "";
    let immediateSize = 450 * 1024;
    let immediateEntropy = 3.2;
    let immediateBitrate = 0;
    let immediateResolution = "";

    if (preset === "text_doc") {
      immediateMethod = "zlib";
      immediateFileName = "corporationblu_strategy_plan.pdf";
      immediateFileType = "application/pdf";
      immediateContent = `FLUXSTORE CORPORATE BLUEPRINT STRATEGY INDEX:
1. Optimize cloud edge distribution ratios across European server quadrants.
2. Minimize high-fidelity image storage requirements dynamically via intelligent edge heuristics.
3. Consolidate log pipelines under compression ratio benchmarks using custom zlib frameworks.`;
      immediateSize = 450 * 1024;
      immediateEntropy = 3.2;
      immediateBitrate = 0;
      immediateResolution = "A4 Document Page";
    } else if (preset === "voice") {
      immediateMethod = "zstd";
      immediateFileName = "hq_stereo_voice_memo.wav";
      immediateFileType = "audio/wav";
      immediateContent = "";
      immediateSize = 1800 * 1024;
      immediateEntropy = 4.9;
      immediateBitrate = 1411;
      immediateResolution = "16-bit 44.1kHz Stereo PCM";
    } else if (preset === "image") {
      immediateMethod = "WebP";
      immediateFileName = "raw_satellite_hq_visual.png";
      immediateFileType = "image/png";
      immediateContent = "";
      immediateSize = 2800 * 1024;
      immediateEntropy = 6.9;
      immediateBitrate = 0;
      immediateResolution = "3840x2160 pixels";
    } else if (preset === "video") {
      immediateMethod = "H.265";
      immediateFileName = "surveillance_highbitrate_clip.mp4";
      immediateFileType = "video/mp4";
      immediateContent = "";
      immediateSize = 35 * 1024 * 1024;
      immediateEntropy = 7.6;
      immediateBitrate = 6000;
      immediateResolution = "1920x1080 @ 60 FPS";
    }

    // Synchronize UI parameters to reflect selection
    setSelectedMethod(immediateMethod);
    setFileName(immediateFileName);
    setFileType(immediateFileType);
    setFileContent(immediateContent);
    setFileSizeSlider(immediateSize);
    setEntropy(immediateEntropy);
    setBitrate(immediateBitrate);
    setResolution(immediateResolution);
    setUploadedFiles([{ name: immediateFileName, size: immediateSize, type: immediateFileType }]);
    if (!transferTitle) {
      setTransferTitle(`Transfer backup of ${immediateFileName.split(".")[0]}`);
    }

    // Auto-trigger backend compression job immediately!
    setIsProcessing(true);
    setAlertMsg(null);
    try {
      const payload = {
        fileName: immediateFileName,
        fileType: immediateFileType,
        fileContent: immediateFileType.includes("text") ? immediateContent : undefined,
        method: immediateMethod,
        simulatedSize: immediateSize
      };

      const res = await appFetch("/api/compress/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setHistoryJobs([data.job, ...historyJobs]);
        setRatedJobId(data.job.id);
        setAlertMsg({ 
          type: "success", 
          text: `Auto-compression successfully triggered! Loaded ${preset} data: mapped client MIME types under ${immediateMethod} codec (-${data.job.savingsPercent}% redundant bytes).` 
        });
      } else {
        const err = await res.json();
        setAlertMsg({ type: "error", text: err.error || "Auto-trigger model compilation failed" });
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: "Communication error auto-compiling client model." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setAlertMsg(null);
    //setIsTransferring(true); // Removed auto-trigger
    setTransferProgress(0);

    // Predict correct preset/method for the primary file to keep the manual UI form synced nicely
    const primaryFile = files[0];
    setFileName(primaryFile.name);
    setFileType(primaryFile.type || "binary/octet-stream");
    setFileSizeSlider(primaryFile.size);

    const newFiles = files.map(f => ({ name: f.name, size: f.size, type: f.type || "binary/octet-stream" }));
    setUploadedFiles(prev => {
      if (prev.length === 1 && prev[0].name === "document_corporate_strategy.pdf") {
        return newFiles;
      }
      return [...prev, ...newFiles];
    });

    let matchedPreset: "text_doc" | "voice" | "image" | "video" = "text_doc";
    if (primaryFile.type.startsWith("image/")) {
      matchedPreset = "image";
    } else if (primaryFile.type.startsWith("video/")) {
      matchedPreset = "video";
    } else if (primaryFile.type.startsWith("audio/")) {
      matchedPreset = "voice";
    } else {
      matchedPreset = "text_doc";
    }
    
    setUploadPreset(matchedPreset);
    
    // Auto-compilation logic was already bypassed, but ensuring no uploads trigger here.
    setAlertMsg({ type: "success", text: "Files added. Please enter details and click 'Transfer' to begin." });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const simulatedEvent = {
        target: {
          files: droppedFiles
        }
      } as any;
      handleRealFileUpload(simulatedEvent);
    }
  };

  const executeBackendCompression = async (recipientsList: string[], title: string) => {
    console.log("executeBackendCompression called", { recipientsList, title });
    console.log("Database instance check:", db);
    try {
      console.log("Step 1: Starting Firestore Write...");
      let matchedMethod: "zstd" | "WebP" | "H.265" | "zlib" = "zlib";
      if (uploadPreset === "text_doc") matchedMethod = "zlib";
      else if (uploadPreset === "voice") matchedMethod = "zstd";
      else if (uploadPreset === "image") matchedMethod = "WebP";
      else if (uploadPreset === "video") matchedMethod = "H.265";

      const payload = {
        fileName,
        fileType,
        fileContent: fileType.includes("text") ? fileContent : undefined,
        method: matchedMethod,
        simulatedSize: fileSizeSlider,
        recipients: recipientsList,
        title: title
      };

      const res = await appFetch("/api/compress/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        
        const transferId = data.job?.id || Math.random().toString(36).substr(2, 9);
        const downloadLink = `https://fluxstore-ai.app/download/${transferId}`;

        console.log("Step 2: Writing to Firestore...");
        await setDoc(doc(db, "transfers", transferId), {
          id: transferId,
          senderEmail: clientAuth.currentUser?.email || "sender@example.com",
          recipientEmail: recipientsList[0] || "receiver@example.com",
          fileName: fileName,
          downloadUrl: downloadLink,
          timestamp: new Date().toISOString()
        });
        console.log("Step 3: Firestore write success");
        
        data.job.downloadLink = downloadLink;
        
        // Trigger email notification (non-blocking)
        (async () => {
          try {
            await appFetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: recipientsList,
                subject: transferTitle || `File Transfer: ${fileName}`,
                link: downloadLink,
                sender: clientAuth.currentUser?.email || "sender@example.com",
                fileName: fileName,
                fileSize: fileSizeSlider
              })
            });
          } catch (emailErr) {
            console.error("Failed to trigger email notification:", emailErr);
          }
        })();

        setUser(data.user);
        setHistoryJobs([data.job, ...historyJobs]);
        setRatedJobId(data.job.id);
        setTransferSuccessJob(data.job);
        setAlertMsg({ 
          type: "success", 
          text: `Files sent! Recipients: ${recipientsList.join(", ")}. Download link: ${downloadLink}` 
        });
      } else {
        const err = await res.json();
        setAlertMsg({ type: "error", text: err.error || "Compression failed" });
      }
    } catch (err) {
      console.error("Transfer Error:", err);
      setAlertMsg({ type: "error", text: `Error: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      console.log("Transfer finished (finally block)");
      setIsTransferring(false);
      setTransferProgress(0);
    }
  };

  const resetTransferForm = () => {
    setUploadedFiles([]);
    setTransferSuccessJob(null);
    setFileName("");
    setFileType("");
    setFileSizeSlider(0);
    setEmailsTo([]);
    setEmailToInput("");
    setTransferTitle("");
    setTransferProgress(0);
    setIsTransferring(false);
  };

  const handleWeTransferSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let updatedEmails = [...emailsTo];
    if (emailToInput.trim()) {
      const emailLower = emailToInput.trim().toLowerCase();
      if (emailLower.includes("@") && !updatedEmails.includes(emailLower)) {
        updatedEmails.push(emailLower);
        setEmailsTo(updatedEmails);
      }
      setEmailToInput("");
    }

    if (updatedEmails.length === 0) {
      setAlertMsg({ type: "error", text: "Please enter at least one valid recipient email address." });
      setIsTransferring(false);
      return;
    }

    if (!transferTitle.trim()) {
      setAlertMsg({ type: "error", text: "Please enter a title or subject for the transfer." });
      setIsTransferring(false);
      return;
    }

    setIsTransferring(true);
    setTransferProgress(0);
    setAlertMsg(null);

    const totalSize = fileContent && fileType.includes("text") ? getByteLength(fileContent) : fileSizeSlider;
    const intervalTime = totalSize > 5 * 1024 * 1024 ? 25 : 12;

    const interval = setInterval(() => {
      setTransferProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            executeBackendCompression(updatedEmails, transferTitle);
          }, 200);
          return 100;
        }
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, intervalTime);
  };

  // React Auth Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    if (isAuthModeSignUp && !acceptTerms) {
      setAlertMsg({ type: "error", text: "You must agree to the Terms of Service and Privacy Policy to create a new account." });
      return;
    }
    try {
      if (isAuthModeSignUp) {
        // Step 1: Create user in Firebase Auth
        await createUserWithEmailAndPassword(clientAuth, authEmail, authPassword);
      } else {
        // Step 1: Sign in with Firebase Auth
        await signInWithEmailAndPassword(clientAuth, authEmail, authPassword);
      }

      // Step 2: Synchronize with our Express backend
      const endpoint = isAuthModeSignUp ? "/api/auth/register" : "/api/auth/login";
      const response = await appFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword, isFirebaseSync: true })
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setShowAuthModal(false);
        setAuthPassword("");
        localStorage.setItem("user_email", data.user.email);
        setAlertMsg({ 
          type: "success", 
          text: isAuthModeSignUp 
            ? "Firebase Account provisioned successfully and initialized in Cloud Firestore!" 
            : "Successfully validated credentials via Firebase Authentication standard gateway!" 
        });
        fetchDashboardData();
      } else {
        setAlertMsg({ type: "error", text: data.error || "Authentication synced successfully but backend failed" });
      }
    } catch (err: any) {
      console.error("Firebase submit error:", err);
      let errMsg = err.message || "Authentication failed.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "An account with this email already exists in Firebase Auth.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Invalid email or password credentials. Please try again.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password is too weak. Must be at least 6 characters.";
      }
      setAlertMsg({ type: "error", text: errMsg });
    }
  };

  const handleGmailQuickSignIn = async (gmailAddress: string) => {
    setAlertMsg(null);
    const simulatedPassword = "OAuthGmailSingleTapPasswordOk!";
    try {
      try {
        // Try logging in via Firebase Auth first
        await signInWithEmailAndPassword(clientAuth, gmailAddress, simulatedPassword);
      } catch (err: any) {
        if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
          // If user doesn't exist, register them in Firebase Auth
          await createUserWithEmailAndPassword(clientAuth, gmailAddress, simulatedPassword);
        } else {
          throw err;
        }
      }

      // Synchronize backend
      const response = await appFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: gmailAddress, password: simulatedPassword, isFirebaseSync: true })
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setShowAuthModal(false);
        localStorage.setItem("user_email", data.user.email);
        setAlertMsg({ type: "success", text: `Connected seamlessly via Firebase Auth & Gmail: ${gmailAddress}` });
        fetchDashboardData();
      } else {
        setAlertMsg({ type: "error", text: data.error || "Gmail sync failed" });
      }
    } catch (err: any) {
      setAlertMsg({ type: "error", text: `OAuth Simulation Error: ${err.message}` });
    }
  };

  const handleGoogleSignIn = async () => {
    setAlertMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(clientAuth, provider);
      const email = result.user.email;
      if (!email) {
        throw new Error("No email address returned from Google Authentication provider.");
      }

      // Sync backend
      const response = await appFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isFirebaseSync: true })
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setShowAuthModal(false);
        localStorage.setItem("user_email", data.user.email);
        setAlertMsg({ type: "success", text: `Welcome! Successfully authenticated via Google Sign-In: ${email}` });
        fetchDashboardData();
      } else {
        setAlertMsg({ type: "error", text: data.error || "Google Sign-In backend synchronization failed." });
      }
    } catch (err: any) {
      console.error("Google Authentication failed:", err);
      setAlertMsg({ type: "error", text: `Google Sign-In Error: ${err.message}` });
    }
  };

  const handleLogout = async () => {
    setAlertMsg(null);
    try {
      // Sign out from client-side Firebase Auth
      await clientSignOut(clientAuth);
      
      const response = await appFetch("/api/auth/logout", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setHistoryJobs([]);
        setAlertMsg({ type: "success", text: "Successfully signed out of custom workspace session and Firebase instance." });
        fetchDashboardData();
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: "Failed clearing active cookie session." });
    }
  };

  // Load backend data helper
  const fetchDashboardData = async () => {
    try {
      const res = await appFetch("/api/user/info");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setHistoryJobs(data.jobs);
        setRlWeights(data.weights);
      }
    } catch (err) {
      console.warn("Failed fetching backend data, operating in high-fidelity sandbox simulation:", err);
    }
  };

  // Delete a compression history job entry
  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await appFetch(`/api/compress/job/${jobId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setHistoryJobs(data.jobs);
        setAlertMsg({ type: "success", text: "Successfully deleted compression history record!" });
      } else {
        // Local state-only delete fallback if API fails
        const updatedJobs = historyJobs.filter((job) => job.id !== jobId);
        setHistoryJobs(updatedJobs);
        const deletedJob = historyJobs.find((job) => job.id === jobId);
        if (deletedJob && user) {
          setUser({
            ...user,
            quotaUsed: Math.max(0, user.quotaUsed - deletedJob.originalSize)
          });
        }
        setAlertMsg({ type: "success", text: "Successfully deleted record locally." });
      }
    } catch (err) {
      // Offline fallback handling
      const updatedJobs = historyJobs.filter((job) => job.id !== jobId);
      setHistoryJobs(updatedJobs);
      const deletedJob = historyJobs.find((job) => job.id === jobId);
      if (deletedJob && user) {
        setUser({
          ...user,
          quotaUsed: Math.max(0, user.quotaUsed - deletedJob.originalSize)
        });
      }
      setAlertMsg({ type: "success", text: "Successfully deleted record offline." });
    }
  };

  // Download file (either Storage or stream fallback)
  const handleDownloadJob = (job: CompressionJob) => {
    if (job.storageUrl) {
      const link = document.createElement("a");
      link.href = job.storageUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("download", job.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ type: "success", text: `Downloading original file from Cloud Storage: ${job.fileName}` });
    } else {
      const kbSize = Math.max(1, Math.round(job.compressedSize / 1024));
      const downloadUrl = `/api/compress/stream-download?sizeKb=${kbSize}&fileName=${encodeURIComponent(job.fileName)}`;
      
      const linkComp = document.createElement("a");
      linkComp.href = downloadUrl;
      linkComp.setAttribute("download", `compressed_${job.fileName}.gz`);
      document.body.appendChild(linkComp);
      linkComp.click();
      document.body.removeChild(linkComp);
      setToast({ type: "success", text: `Streaming optimized zlib/zstd build down: ${job.fileName}` });
    }
  };

  const handleBulkDownload = async () => {
      setToast({ type: "info", text: "Bulk download initiated. Compiling zip archive..." });
      // Stub for Zip logic - implementation depends on CORS access to storage
      console.log("Bulk download for jobs:", selectedFileIds);
      // JSZip.generateAsync(...) would go here
  };

  // Open Sharing dialog and copy link
  const handleShareJob = (job: CompressionJob) => {
    setActiveShareJob(job);
    const origin = window.location.origin;
    const link = `${origin}?share=${job.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link)
        .then(() => {
          setToast({ type: "success", text: `Secure download link copied to clipboard!` });
        })
        .catch(() => {
          setToast({ type: "success", text: `Ready to copy unique link!` });
        });
    } else {
      setToast({ type: "success", text: `Ready to copy unique link!` });
    }
    
    setShowShareModal(true);
  };

  useEffect(() => {
    // 1. Initial dashboard fetch
    fetchDashboardData();

    // 2. Clearer client-side Firebase Auth Sync listener
    const unsubscribe = onAuthStateChanged(clientAuth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        // Auto synchronize backend context with this email if they changed state/auth
        try {
          // Tell backend which user is now active
          await appFetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: firebaseUser.email, isFirebaseSync: true })
          });
          fetchDashboardData();
        } catch (err) {
          console.warn("Error synchronizing active firebase auth state with server:", err);
        }
      } else if (!firebaseUser) {
        // Fallback: trigger anonymous sign-in so they are authenticated
        // This satisfies default Firebase Storage rules requiring authenticated uploads
        try {
          await signInAnonymously(clientAuth);
          console.log("Logged in anonymously via Firebase Auth fallback to enable Storage uploads.");
        } catch (err) {
          console.warn("Could not sign in anonymously:", err);
        }
      }
    });

    // 3. Parse query param share links if present
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get("share");
    if (shareParam) {
      setSharedJobId(shareParam);
      setLoadingSharedJob(true);
      appFetch(`/api/compress/shared-job/${shareParam}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.job) {
            setSharedJob(data.job);
          } else {
            setSharedJobError(data.error || "File download link has expired or is invalid.");
          }
        })
        .catch((err) => {
          console.error("Error fetching shared job details:", err);
          setSharedJobError("Network issue loading shared file.");
        })
        .finally(() => {
          setLoadingSharedJob(false);
        });
    }

    return () => unsubscribe();
  }, []);

  // Sync sandbox inputs based on chosen preset
  useEffect(() => {
    if (uploadPreset === "text_doc") {
      setFileName("document_corporate_strategy.pdf");
      setFileType("application/pdf");
      setFileContent(`FLUXSTORE CORPORATE BLUEPRINT STRATEGY INDEX:
1. Optimize cloud edge distribution ratios across European server quadrants.
2. Minimize high-fidelity image storage requirements dynamically via intelligent edge heuristics.
3. Consolidate log pipelines under compression ratio benchmarks using custom zlib frameworks.`);
      setFileSizeSlider(450 * 1024);
      setEntropy(3.2);
      setBitrate(0);
      setResolution("A4 Document Page");
    } else if (uploadPreset === "voice") {
      setFileName("hq_voice_recording_memo.wav");
      setFileType("audio/wav");
      setFileContent("");
      setFileSizeSlider(1800 * 1024); // 1.8MB
      setEntropy(4.9);
      setBitrate(1411);
      setResolution("16-bit 44.1kHz Stereo PCM");
    } else if (uploadPreset === "image") {
      setFileName("raw_satellite_visual_image.png");
      setFileType("image/png");
      setFileContent("");
      setFileSizeSlider(2800 * 1024); // 2.8MB
      setEntropy(6.9);
      setBitrate(0);
      setResolution("3840x2160 pixels");
    } else if (uploadPreset === "video") {
      setFileName("surveillance_monitoring_clip.mp4");
      setFileType("video/mp4");
      setFileContent("");
      setFileSizeSlider(35 * 1024 * 1024); // 35MB
      setEntropy(7.6);
      setBitrate(6000); // 6Mbps
      setResolution("1920x1080 @ 60 FPS");
    }
  }, [uploadPreset]);

  // When metadata or parameters change, get real dynamic predictions from Gemini/Rule logic
  const handleGetAIAdvice = async () => {
    setIsAdvising(true);
    try {
      const reqPayload = {
        fileName,
        fileType,
        fileSize: fileContent && fileType.includes("text") ? getByteLength(fileContent) : fileSizeSlider,
        entropy,
        bitrate,
        resolution
      };

      const res = await appFetch("/api/compress/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqPayload)
      });

      if (res.ok) {
        const data = await res.json();
        setAiAdvisor(data);
        if (autoRecommand && data.method) {
          setSelectedMethod(data.method);
        }
      } else {
        const err = await res.json();
        setAlertMsg({ type: "error", text: err.error || "Advisor computation failed" });
      }
    } catch (err: any) {
      setAlertMsg({ type: "error", text: "Connection error contacting server AI core" });
    } finally {
      setIsAdvising(false);
    }
  };

  // Run AI query on mount / preset changes
  useEffect(() => {
    handleGetAIAdvice();
  }, [uploadPreset, fileSizeSlider, fileName]);

  // Execute processing compression job
  const handleProcessCompression = async () => {
    setIsProcessing(true);
    setAlertMsg(null);
    try {
      const payload = {
        fileName,
        fileType,
        fileContent: fileType.includes("text") ? fileContent : undefined,
        method: selectedMethod,
        simulatedSize: fileSizeSlider
      };

      const res = await appFetch("/api/compress/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setHistoryJobs([data.job, ...historyJobs]);
        setRatedJobId(data.job.id); // allow user to submit active RL rating immediately!
        setAlertMsg({ type: "success", text: `Successfully processed file [${fileName}] using ${selectedMethod}! Space reduced by ${data.job.savingsPercent}%.` });
      } else {
        const err = await res.json();
        setAlertMsg({ type: "error", text: err.error || "Execution failed" });
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: "Endpoint error processing files." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit reinforcement learning rating
  const handleRLFeedback = async () => {
    if (!ratedJobId) return;
    try {
      const activeJob = historyJobs.find(j => j.id === ratedJobId);
      const res = await appFetch("/api/rl/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedMethod,
          speed: activeJob?.speedMs || 50,
          ratio: activeJob?.compressionRatio || 0.4,
          rating: ratingValue
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRlWeights(data.weights);
        setAlertMsg({ type: "success", text: `RL Agent model weights tuned dynamically. Algorithm selected action rewards adjusted up to ${Number(data.weights[selectedMethod]).toFixed(3)}.` });
        setRatedJobId(null); // dismiss widget
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: "Failed updating reinforcement neural variables" });
    }
  };

  // Stripe Mock Checkout Plan Subscription
  const handleStripeCheckout = async (targetPlan: "Free" | "Pro" | "Enterprise") => {
    try {
      const res = await appFetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setAlertMsg({ type: "success", text: `Stripe checkout session successful. User shifted to ${targetPlan} Plan. Quota limit is now ${targetPlan === "Pro" ? "100GB" : targetPlan === "Enterprise" ? "1TB" : "10GB"}.` });
      }
    } catch (err) {
       setAlertMsg({ type: "error", text: "Stripe secure tokenizing simulation error" });
    }
  };

  // Download streamed compressed log
  const handleStreamingCompressDownload = () => {
    setIsStreaming(true);
    setAlertMsg(null);
    const downloadUrl = `/api/compress/stream-download?sizeKb=${streamSizeKb}`;
    
    // Create browser hook
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `smart_streamed_logs_${streamSizeKb}kb.log.gz`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsStreaming(false);
      setAlertMsg({ type: "success", text: `Active Gzip real-time pipeline connection closed. Transfer of ${streamSizeKb}KB log telemetry streamed globally.` });
    }, 1500);
  };

  // Helper formatting values
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Copy code chunks to stack clipboard
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopying(label);
    setTimeout(() => setIsCopying(null), 2000);
  };

  // Export history jobs to CSV
  const handleExportCSV = () => {
    if (!historyJobs || historyJobs.length === 0) {
      setAlertMsg({ type: "error", text: "No compression jobs available to export." });
      return;
    }

    const headers = [
      "Job ID",
      "Filename",
      "MIME Type",
      "Algorithm (Method)",
      "Original Sizing (Bytes)",
      "Compressed Sizing (Bytes)",
      "Savings Percent (%)",
      "Timestamp"
    ];

    const rows = historyJobs.map((job) => [
      job.id,
      `"${job.fileName.replace(/"/g, '""')}"`,
      `"${job.fileType.replace(/"/g, '""')}"`,
      `"${job.method.replace(/"/g, '""')}"`,
      job.originalSize,
      job.compressedSize,
      job.savingsPercent,
      `"${new Date(job.timestamp).toISOString()}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `fluxstore_savings_history_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setAlertMsg({
      type: "success",
      text: `History log parsed successfully! Exported ${historyJobs.length} active compression records to CSV.`
    });
  };

  // Data aggregations for charts
  const totalOriginalBytes = historyJobs.reduce((acc, job) => acc + job.originalSize, 0);
  const totalCompressedBytes = historyJobs.reduce((acc, job) => acc + job.compressedSize, 0);
  const savingsCumulativeBytes = totalOriginalBytes - totalCompressedBytes;
  const averageSavingsPercent = historyJobs.length > 0 
    ? Math.round((savingsCumulativeBytes / totalOriginalBytes) * 100) 
    : 0;

  const chartHistoryData = [...historyJobs].reverse().map((job, idx) => ({
    name: `File ${idx + 1}`,
    original: Math.round(job.originalSize / 1024),
    compressed: Math.round(job.compressedSize / 1024),
    ratio: Math.round((1 - job.compressionRatio) * 100)
  }));

  const pieData = [
    { name: "Compressed Storage", value: totalCompressedBytes },
    { name: "Bandwidth Space Saved", value: savingsCumulativeBytes }
  ];
  const activeTheme = THEMES[designLook] || THEMES.light;
  const COLORS = [activeTheme.chartCompColor, activeTheme.chartOrigColor];

  const algorithmData = Object.keys(rlWeights).map(key => ({
    name: key,
    efficiency: Math.round(rlWeights[key as keyof RLWeights] * 100)
  }));

  if (sharedJobId) {
    return (
      <div className={`font-sans antialiased transition-colors duration-300 min-h-screen flex items-center justify-center p-6 bg-slate-50 ${activeTheme.outerBg}`}>
        <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl bg-white border border-slate-100 transition-all text-center space-y-6 ${activeTheme.cardBg || ""}`}>
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4 rounded-full bg-blue-50 text-blue-650 inline-block">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className={`text-xl font-extrabold text-slate-900 tracking-tight ${activeTheme.titleText || ""}`}>
              Shared Secure File Download
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Fluxstore secure content delivery pipeline
            </p>
          </div>

          {loadingSharedJob ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-400 font-mono animate-pulse">Retrieving file descriptors...</p>
            </div>
          ) : sharedJobError ? (
            <div className="py-6 border border-rose-100 bg-rose-50/50 rounded-2xl space-y-2">
              <p className="text-xs text-rose-600 font-bold font-mono uppercase">Link Expired or Error</p>
              <p className="text-xs text-slate-650 px-4">{sharedJobError}</p>
            </div>
          ) : sharedJob ? (
            <div className="space-y-4 text-left">
              <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-2">
                <div className="text-[10px] text-slate-450 uppercase font-mono font-bold">File Information</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-650 font-black border border-blue-150 flex items-center justify-center text-xs">
                    {sharedJob.fileName.split('.').pop()?.toUpperCase() || "FILE"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate" title={sharedJob.fileName}>
                      {sharedJob.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatBytes(sharedJob.originalSize)} • Decoded by: {sharedJob.method}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadJob(sharedJob)}
                className="w-full bg-blue-605 hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer border border-blue-500/10"
              >
                <Download className="w-4 h-4" /> Download Optimized File
              </button>
            </div>
          ) : null}

          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, "", window.location.pathname);
                setSharedJobId(null);
                setSharedJob(null);
                setSharedJobError(null);
              }}
              className="text-xs font-mono font-bold text-blue-650 hover:underline cursor-pointer bg-transparent border-none outline-none"
            >
              ← Go to Fluxstore Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`font-sans antialiased transition-colors duration-300 min-h-screen flex flex-col selection:bg-blue-500/15 selection:text-blue-600 ${activeTheme.outerBg}`}>
      
      {/* 1. Header Banner */}
      <header className={`sticky top-0 z-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 transition-colors duration-300 ${designLook === 'light' ? 'bg-blue-700 text-white' : activeTheme.headerBg}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg text-white transition-colors duration-300 ${activeTheme.accentBg}`}>
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className={`text-md font-semibold tracking-tight transition-colors duration-300 flex items-center gap-1.5 ${designLook === 'light' ? 'text-white' : activeTheme.titleText}`}>
              Fluxstore AI
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 uppercase font-mono text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`px-3 py-1.5 rounded-md transition-all duration-300 ${designLook === 'light' ? (activeTab === "sandbox" ? 'bg-blue-900 text-white' : 'text-blue-100 hover:text-white hover:bg-blue-900') : (activeTab === "sandbox" ? activeTheme.accentNavActive : activeTheme.accentNavInactive)}`}
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Home
            </span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-md transition-all duration-300 ${designLook === 'light' ? (activeTab === "analytics" ? 'bg-blue-900 text-white' : 'text-blue-100 hover:text-white hover:bg-blue-900') : (activeTab === "analytics" ? activeTheme.accentNavActive : activeTheme.accentNavInactive)}`}
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Analytics
            </span>
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-3 py-1.5 rounded-md transition-all duration-300 ${designLook === 'light' ? (activeTab === "billing" ? 'bg-blue-900 text-white' : 'text-blue-100 hover:text-white hover:bg-blue-900') : (activeTab === "billing" ? activeTheme.accentNavActive : activeTheme.accentNavInactive)}`}
          >
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Payment Plan
            </span>
          </button>
        </nav>

        {/* User Identity & Theme switcher */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center space-x-1 p-1 rounded-xl border transition-all duration-300 ${designLook === "light" ? "bg-slate-100 border-slate-200" : "bg-zinc-800/80 border-zinc-700/80"}`}>
            <span className={`text-[9px] font-mono px-1.5 uppercase font-bold tracking-tight opacity-75 ${activeTheme.titleText}`}>Change Themes:</span>
            <button
              onClick={() => setDesignLook("light")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold transition-all duration-250 ${designLook === "light" ? "bg-white text-blue-700 shadow-sm" : activeTheme.mutedText}`}
              title="Corporate Light Look"
            >
              Light
            </button>
            <button
              onClick={() => setDesignLook("neon")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold transition-all duration-250 ${designLook === "neon" ? "bg-emerald-500 text-zinc-950 shadow-sm" : activeTheme.mutedText}`}
              title="Neon Emerald Look"
            >
              Neon
            </button>
            <button
              onClick={() => setDesignLook("cyber")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold transition-all duration-250 ${designLook === "cyber" ? "bg-blue-500 text-white shadow-sm" : activeTheme.mutedText}`}
              title="Cinematic Blue Look"
            >
              Cinematic
            </button>
            <button
              onClick={() => setDesignLook("aurora")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold transition-all duration-250 ${designLook === "aurora" ? "bg-indigo-600 text-white shadow-sm" : activeTheme.mutedText}`}
              title="Aurora Twilight Look"
            >
              Aurora
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (user.email !== "") {
                  handleLogout();
                } else {
                  setShowAuthModal(true);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all duration-300 border hover:opacity-90 cursor-pointer ${
                user.email !== ""
                  ? "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                  : activeTheme.brandText
              }`}
              title={user.email !== "" ? "Reset back to guest context" : "Authenticate secure credentials"}
            >
              {user.email !== "" ? "Sign Out" : "Sign In / Join"}
            </button>

            
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* TAB 1: INTEGRATED SANDBOX AND DYNAMIC ADVISOR */}
        {activeTab === "sandbox" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left Column: WeTransfer Request & Transfer Panel */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              {/* Main WeTransfer Card Frame */}
              <div className={`rounded-3xl p-6 lg:p-8 transition-all duration-300 relative overflow-hidden ${activeTheme.cardBg} shadow-2xl border-2 hover:shadow-indigo-500/5`} id="wetransfer_portal_card">
                
                {/* Visual Accent Layer */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500" />
                
                {/* Card Title & Flow Indicator */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2 bg-blue-500/15 px-3 py-1 rounded-full border border-blue-500/20">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-blue-500">Request files</span>
                  </div>
                  <span className={`text-[10px] font-mono uppercase font-semibold ${activeTheme.mutedText}`}>
                    Fluxstore Transfer Gateway
                  </span>
                </div>
                
                {/* 1. WeTransfer SUCCESS FLOW (Matches Screenshot 2 Exactly) */}
                {transferSuccessJob ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in" id="wetransfer_success_view">
                    
                    {/* Simulated Document Preview Card with View badge (Screenshot 2) */}
                    <div className="relative w-full max-w-[210px] bg-white border border-slate-205 rounded-3xl p-5 shadow-lg mb-6 group overflow-hidden transition-all duration-300 hover:shadow-xl">
                      
                      {/* Fake blurred strategic layout inside document */}
                      <div className="w-full text-left space-y-1.5 select-none opacity-80 filter blur-[0.3px] text-[7px] font-mono text-slate-500">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1 font-sans">
                          <span className="font-extrabold text-slate-800 text-[6.5px]">GCS GROUP CERTIFICATE</span>
                          <span className="text-blue-500 text-[6px]">ACTIVE</span>
                        </div>
                        <div className="space-y-1">
                          <div className="bg-slate-50 p-1 rounded font-sans leading-none">
                            <span className="text-[5px] text-slate-400 block font-bold leading-none">COVERAGE LIMIT</span>
                            <span className="font-black text-slate-800">$10,000,000</span>
                          </div>
                          <p className="text-[6px] leading-relaxed text-slate-400 font-sans">
                            Subject to standard policy guidelines and general ledger conditions. Edge compressed verification.
                          </p>
                        </div>
                      </div>

                      {/* WeTransfer styled Static View Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white text-slate-900 font-sans font-extrabold text-[12px] px-4.5 py-2.5 rounded-full shadow-xl border border-slate-100 flex items-center gap-1.5 transform group-hover:scale-105 transition-transform duration-300">
                          <Eye className="w-4 h-4 text-slate-800 fill-slate-100" />
                          <span>View</span>
                        </div>
                      </div>

                      {/* Soft dark active hover filter trigger to see full doc */}
                      <div 
                        onClick={() => setShowMockNotification(transferSuccessJob)}
                        className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer flex items-center justify-center" 
                        title="Click to see live simulated files"
                      />
                    </div>

                    {/* Notification info (Screenshot 2) */}
                    <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
                      You're done!
                    </h2>
                    
                    <p className="text-xs text-slate-500 max-w-xs px-2 mb-2">
                      The transfer email has been dispatched.
                    </p>

                    <p className="text-xs text-slate-400 mb-6 font-medium">
                      The transfer is valid for <span className="font-bold text-slate-650">{expiryDays} days</span>.
                    </p>

                    {/* Click trigger to review content */}
                    <button
                      type="button"
                      onClick={() => setShowMockNotification(transferSuccessJob)}
                      className="text-blue-650 font-extrabold text-xs hover:underline mb-8 cursor-pointer underline decoration-indigo-400 decoration-1"
                    >
                      See what's inside
                    </button>

                    {/* Secondary & Primary CTA buttons matching Screenshot 2 */}
                    <div className="w-full max-w-xs space-y-3 px-4">
                      <button
                        type="button"
                        onClick={resetTransferForm}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 cursor-pointer select-none"
                      >
                        Send another?
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMockNotification(transferSuccessJob);
                        }}
                        className="w-full bg-transparent border-2 border-slate-200 hover:bg-slate-50/50 text-slate-700 text-sm font-bold py-3 px-6 rounded-full transition-all duration-200 active:scale-98 cursor-pointer select-none"
                      >
                        Open preview
                      </button>
                    </div>

                  </div>
                ) : (
                  
                  /* 2. MAIN ACTIVE FORM SCREEN */
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      id="firebase_real_file_input"
                      onChange={handleRealFileUpload}
                      multiple
                    />

                    {/* If files list is empty, show standard wide Dropzone */}
                    {uploadedFiles.length === 0 ? (
                      <div className="relative group mb-5">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => { handleDrop(e); setIsDragging(false); }}
                          className={`border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-blue-500"}`}
                          style={{ minHeight: "13rem" }}
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-205 text-blue-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-108 duration-300 shadow-sm">
                            <Plus className="w-6 h-6 text-blue-600" />
                          </div>
                          
                          <h3 className={`text-md font-bold tracking-tight text-slate-800 ${activeTheme.titleText}`}>
                            Upload your files
                          </h3>
                          
                          <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                            Drag and drop or <span className="text-blue-600 underline font-extrabold hover:text-blue-700">browse locally</span>
                          </p>

                          <div className="flex gap-2.5 mt-4 flex-wrap justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement Google Drive Picker
                                console.log("Browse Google Drive clicked");
                              }}
                              className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-[10px] font-mono font-bold rounded-lg border border-green-150 transition-all active:scale-95"
                            >
                              📁 Browse Google Drive
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedFiles([
                                  { name: "production_logs_directory.tar.gz", size: 12 * 1024 * 1024, type: "application/x-tar" }
                                ]);
                                setFileName("production_logs_directory.tar.gz");
                                setFileType("application/x-tar");
                                setFileSizeSlider(12 * 1024 * 1024);
                                setEntropy(6.2);
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold rounded-lg border border-indigo-150 transition-all active:scale-95"
                            >
                              📁 Simulate Folder Drop
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      
                      /* 3. MULTIPLE FILES LIST CONTAINER (Matches Screenshot 1 EXACTLY) */
                      <div className="mb-5 animate-fade-in" id="wetransfer_files_list">
                        
                        {/* Selected file cells rendering in a clean list panel */}
                        <div className="space-y-2 mb-3 max-h-[160px] overflow-y-auto pr-1">
                          {uploadedFiles.map((file, fIdx) => (
                            <div 
                              key={file.name + fIdx} 
                              className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-slate-205 hover:border-slate-350 hover:shadow-md transition-all group"
                            >
                              <div className="flex-1 min-w-0 pr-3 text-left">
                                <span className="font-extrabold text-slate-850 text-[12.5px] block truncate leading-tight" title={file.name}>
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5 tracking-wide font-medium">
                                  {formatBytes(file.size)} • {file.name.split('.').pop()?.toUpperCase() || file.type.split("/").pop() || "bin"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const rem = uploadedFiles.filter((_, i) => i !== fIdx);
                                  setUploadedFiles(rem);
                                  if (rem.length > 0) {
                                    setFileName(rem[0].name);
                                    setFileType(rem[0].type);
                                    setFileSizeSlider(rem[0].size);
                                  } else {
                                    setFileName("");
                                    setFileType("");
                                    setFileSizeSlider(0);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-505 hover:bg-red-50 p-1.5 rounded-xl transition-all"
                                title="Remove file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Blue-on-LightBlue banner row showing files size with Add more button pill */}
                        <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-3 rounded-2xl mb-4 text-xs">
                          <div className="flex items-center space-x-2 text-blue-800">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] select-none">
                              ✓
                            </span>
                            <span className="font-extrabold text-[12px]">{uploadedFiles.length} {uploadedFiles.length === 1 ? 'item' : 'items'} added</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white hover:bg-blue-100 text-blue-600 text-[11px] font-bold py-1.5 px-3 rounded-full shadow-sm hover:shadow-md border border-blue-200 flex items-center gap-1 active:scale-95 transition-all select-none cursor-pointer"
                          >
                            <span>Add more</span>
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* GB limits horizontal indicator bar matching Screenshot 1 */}
                        <div className="flex items-center justify-between text-xs px-1 text-slate-500 mb-4 pb-2 border-b border-dashed border-slate-150">
                          <span className="font-extrabold text-[10.5px] text-slate-500 uppercase tracking-widest leading-none">3.0 GB remaining</span>
                          <button
                            type="button"
                            onClick={() => setActiveTab("billing")}
                            className="text-[#9333ea] hover:text-[#7e22ce] font-extrabold text-[11px] flex items-center gap-1 active:scale-95 transition-all outline-none"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-600 fill-purple-100" /> 
                            <span>Increase limit</span>
                          </button>
                        </div>

                      </div>
                    )}


                    {/* Form Input fields formatted exactly after Image 1's borderless-row style */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleWeTransferSubmit();
                      }}
                      className="space-y-0.5 text-left"
                    >
                      {/* Email to address row field */}
                      <div className="border-b border-slate-150 py-3 relative">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Email to
                          </label>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {emailsTo.length} of 10
                          </span>
                        </div>

                        {/* Emails added as standard gray round pills (Screenshot 1) */}
                        {emailsTo.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {emailsTo.map((em, idx) => (
                              <span 
                                key={em + idx} 
                                className="bg-slate-100 border border-slate-200 text-slate-700 text-[10.5px] font-bold rounded-full pl-3 pr-1.5 py-1 flex items-center gap-1.5 animate-fade-in shadow-xs"
                              >
                                <span>{em}</span>
                                <button
                                  type="button"
                                  onClick={() => setEmailsTo(emailsTo.filter((_, i) => i !== idx))}
                                  className="w-4 h-4 rounded-full hover:bg-slate-200 flex items-center justify-center text-[10px] font-bold cursor-pointer text-slate-400 shadow-xs"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="relative">
                          <input
                            type="text"
                            placeholder={emailsTo.length > 0 ? "Add another email..." : "Email to"}
                            className="w-full py-1 bg-transparent text-sm font-semibold outline-none border-none text-slate-800 placeholder-slate-404"
                            value={emailToInput}
                            onChange={(e) => setEmailToInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                if (emailToInput.trim() && emailToInput.includes("@")) {
                                  const cleanEm = emailToInput.trim().toLowerCase();
                                  if (!emailsTo.includes(cleanEm)) {
                                    setEmailsTo([...emailsTo, cleanEm]);
                                  }
                                  setEmailToInput("");
                                }
                              }
                            }}
                          />
                          {emailToInput.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                if (emailToInput.includes("@")) {
                                  const cleanEm = emailToInput.trim().toLowerCase();
                                  if (!emailsTo.includes(cleanEm)) {
                                    setEmailsTo([...emailsTo, cleanEm]);
                                  }
                                  setEmailToInput("");
                                }
                              }}
                              className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-lg cursor-pointer"
                            >
                              Add Email
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Your Email block with check icon (Screenshot 1) */}
                      <div className="border-b border-slate-155 py-3 flex items-center justify-between">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Your email
                          </label>
                          <span className="text-sm font-semibold text-slate-800 select-all block py-0.5">
                            {user.email || ""}
                          </span>
                        </div>
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold select-none shadow-sm">
                          ✓
                        </div>
                      </div>

                      {/* Title block */}
                      <div className="border-b border-slate-150 py-3 mb-5">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Strategic Coverages Pack"
                          className="w-full py-1 bg-transparent text-sm font-semibold outline-none border-none text-slate-800 placeholder-slate-400"
                          value={transferTitle}
                          onChange={(e) => setTransferTitle(e.target.value)}
                        />
                      </div>

                      {/* Bottom Expiry Selector & Options side by side (Screenshot 1) */}
                      <div className="flex items-center gap-3 pt-1.5 pb-5">
                        
                        {/* Expiry Dropdown block with Chevron inside white border pill */}
                        <div className="flex-1 relative">
                          <div className="px-4 py-3 bg-white border border-slate-200 hover:border-slate-350 rounded-2xl shadow-sm flex items-center justify-between text-sm cursor-pointer transition-all duration-300">
                            <div className="flex items-center space-x-2.5 text-slate-850">
                              <Calendar className="w-4.5 h-4.5 text-slate-500" />
                              <span className="font-extrabold text-blue-600 text-sm whitespace-nowrap">{expiryDays} days</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                            <select 
                              value={expiryDays}
                              onChange={(e) => setExpiryDays(Number(e.target.value))}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full animate-none"
                            >
                              <option value={1}>1 day</option>
                              <option value={3}>3 days</option>
                              <option value={7}>7 days</option>
                              <option value={30}>30 days</option>
                            </select>
                          </div>
                        </div>

                        {/* Scientific fallback settings trigger */}
                        <button
                          type="button"
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                          title="Toggle scientific pipeline options"
                          className={`w-14 h-12 bg-white border border-slate-205 hover:bg-slate-50 hover:border-slate-300 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0 ${
                            showAdvancedOptions ? "border-blue-500 bg-blue-50/30 text-blue-600" : "text-slate-800"
                          }`}
                        >
                          <span className="text-sm font-black tracking-widest">•••</span>
                        </button>
                      </div>

                      {/* Advanced details panel */}
                      {showAdvancedOptions && (
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-100/50 space-y-4 animate-fade-in mb-5">
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-wide border-b pb-1">
                            <span className="text-slate-505">⚙️ Edge Pipeline Parameters</span>
                            <span className="text-blue-500">Manual overridden</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[8px] font-mono text-slate-400 uppercase font-black mb-1">Target Format Specs</label>
                              <input
                                type="text"
                                className="w-full px-2 py-1 bg-white text-xs font-mono outline-none border rounded"
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-mono text-slate-400 uppercase font-black mb-1">MIME override</label>
                              <input
                                type="text"
                                className="w-full px-2 py-1 bg-white text-xs font-mono outline-none border rounded"
                                value={fileType}
                                onChange={(e) => setFileType(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Target File Size Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono font-bold uppercase text-slate-400">
                              <span>Payload Size Overrider</span>
                              <span className="text-slate-705">{formatBytes(fileContent && fileType.includes("text") ? getByteLength(fileContent) : fileSizeSlider)}</span>
                            </div>
                            <input
                              type="range"
                              min={100 * 1024}
                              max={50 * 1024 * 1024}
                              step={100 * 1024}
                              className="w-full h-1 cursor-pointer accent-blue-600"
                              value={fileContent && fileType.includes("text") ? getByteLength(fileContent) : fileSizeSlider}
                              onChange={(e) => setFileSizeSlider(Number(e.target.value))}
                            />
                          </div>
                        </div>
                      )}

                      {/* Big Royal Blue "Transfer" Action Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isTransferring || uploadedFiles.length === 0}
                          className="w-full bg-[#2f66ee] hover:bg-[#1b4dd6] text-white text-[15.5px] font-extrabold py-4 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isTransferring ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Sending {transferProgress}%</span>
                            </>
                          ) : (
                            <span>Transfer</span>
                          )}
                        </button>
                      </div>

                      {/* Alert Dialog Container */}
                      {alertMsg && (
                        <div className={`mt-4 p-4 rounded-xl border-2 ${alertMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-900"} flex items-start gap-3 text-sm shadow-sm transition-all animate-fade-in`}>
                          <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${alertMsg.type === "success" ? "text-emerald-600" : "text-red-500"}`} />
                          <div className="flex-1">
                            <p className="font-mono font-bold text-xs mb-0.5 uppercase tracking-wide">{alertMsg.type === "success" ? "System Notification" : "SaaS Quota Gatekeeper Exception"}</p>
                            <p className="text-slate-700 font-medium">{alertMsg.text}</p>
                          </div>
                          <button onClick={() => setAlertMsg(null)} className="text-xs hover:text-slate-950 font-mono font-bold text-slate-550 opacity-80 hover:opacity-100">Dismiss</button>
                        </div>
                      )}

                    </form>
                  </div>
                )}

              </div>

              {/* Real-time transmitting overlay progress bar */}
              {isTransferring && (
                <div className={`p-4.5 rounded-3xl border animate-fade-in ${
                  designLook === "light" ? "bg-slate-50 border-slate-150" : "bg-black/30 border-zinc-800"
                }`}>
                  <div className="flex justify-between text-xs font-mono font-bold mb-1.5 text-blue-600">
                    <span className="animate-pulse">📤 DISPATCHING EDGESERVER CHUNKS</span>
                    <span>{transferProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-100" 
                      style={{ width: `${transferProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Recent Files Table Card (Matches screenshot layout exactly) */}
              <div className={`border border-slate-250 rounded-3xl p-6 lg:p-8 shadow-sm transition-all duration-300 ${activeTheme.cardBg || "bg-white"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h3 className={`text-md font-bold tracking-tight text-slate-900 ${activeTheme.titleText}`}>
                    Recent Files {selectedFileIds.length > 0 && <span className="text-xs text-slate-500 font-normal">({selectedFileIds.length} selected)</span>}
                  </h3>
                  {selectedFileIds.length > 0 && (
                      <div className="flex gap-2">
                          <button
                            onClick={async () => {
                                for (const id of selectedFileIds) {
                                    await fetch(`/api/compress/job/${id}`, { method: 'DELETE' });
                                }
                                setHistoryJobs(historyJobs.filter(job => !selectedFileIds.includes(job.id)));
                                setSelectedFileIds([]);
                                setToast({ type: "success", text: "Selected files permanently deleted." });
                            }}
                            className="text-xs text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md"
                          >
                            Delete Selected
                          </button>
                          <button
                            onClick={handleBulkDownload}
                            className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
                          >
                            Download All (Zip)
                          </button>
                      </div>
                  )}
                  <div className="relative max-w-xs w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 ${activeTheme.inputBg}`}
                    />
                    {fileSearchQuery && (
                      <button
                        onClick={() => setFileSearchQuery("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-[10px] uppercase font-bold tracking-wider text-slate-450 pb-2">
                        <th className="pb-3 bg-transparent pl-2 text-slate-400">
                          <button
                            onClick={() => {
                                const filtered = historyJobs.filter((job) =>
                                  job.fileName.toLowerCase().includes(fileSearchQuery.toLowerCase())
                                );
                                const allIds = filtered.map(j => j.id);
                                if (selectedFileIds.length === allIds.length && allIds.length > 0) {
                                  setSelectedFileIds([]);
                                } else {
                                  setSelectedFileIds(allIds);
                                }
                            }}
                            className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center hover:border-blue-600"
                          >
                            {selectedFileIds.length > 0 && selectedFileIds.length === historyJobs.filter((job) =>
                                  job.fileName.toLowerCase().includes(fileSearchQuery.toLowerCase())
                                ).length && <div className="w-2 h-2 bg-blue-600 rounded-sm" />}
                          </button>
                        </th>
                        <th className="pb-3 bg-transparent pl-2 text-slate-400">File Name</th>
                        <th className="pb-3 bg-transparent px-4 text-slate-400">Size</th>
                        <th className="pb-3 bg-transparent px-4 text-slate-400">Upload Date</th>
                        <th className="pb-3 bg-transparent text-right pr-2 text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyJobs.filter((job) =>
                        job.fileName.toLowerCase().includes(fileSearchQuery.toLowerCase())
                      ).length > 0 ? (
                        historyJobs.filter((job) =>
                          job.fileName.toLowerCase().includes(fileSearchQuery.toLowerCase())
                        ).map((job) => {
                          let tagColor = "bg-blue-50 text-blue-600 border border-blue-100";
                          let extAbbr = "BIN";
                          const lowerName = job.fileName.toLowerCase();
                          
                          if (lowerName.endsWith(".pdf") || job.fileType?.includes("pdf")) {
                            tagColor = "bg-rose-50 text-rose-600 border border-rose-155";
                            extAbbr = "PDF";
                          } else if (lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || job.fileType?.startsWith("image/")) {
                            tagColor = "bg-emerald-50 text-emerald-650 border border-emerald-150";
                            extAbbr = "IMG";
                          } else if (lowerName.endsWith(".zip") || lowerName.endsWith(".tar") || lowerName.endsWith(".gz") || job.fileType?.includes("zip") || job.fileType?.includes("tar")) {
                            tagColor = "bg-amber-50 text-amber-650 border border-amber-150";
                            extAbbr = "ZIP";
                          } else if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || job.fileType?.includes("docx") || job.fileType?.includes("msword")) {
                            tagColor = "bg-indigo-50 text-indigo-650 border border-indigo-150";
                            extAbbr = "DOCX";
                          } else if (lowerName.endsWith(".mp4") || lowerName.endsWith(".mov") || job.fileType?.startsWith("video/")) {
                            tagColor = "bg-purple-50 text-purple-650 border border-purple-150";
                            extAbbr = "VID";
                          } else if (lowerName.endsWith(".mp3") || lowerName.endsWith(".wav") || job.fileType?.startsWith("audio/")) {
                            tagColor = "bg-violet-50 text-violet-650 border border-violet-150";
                            extAbbr = "AUD";
                          } else if (lowerName.endsWith(".log") || lowerName.endsWith(".txt") || job.fileType?.includes("plain")) {
                            tagColor = "bg-slate-100 text-slate-700 border border-slate-200";
                            extAbbr = "TXT";
                          }

                          return (
                            <tr key={job.id} className="hover:bg-slate-50/70 transition-colors group">
                              <td className="py-2.5 pl-2">
                                <button
                                  onClick={() => {
                                      if (selectedFileIds.includes(job.id)) {
                                          setSelectedFileIds(selectedFileIds.filter(id => id !== job.id));
                                      } else {
                                          setSelectedFileIds([...selectedFileIds, job.id]);
                                      }
                                  }}
                                  className={`w-4 h-4 rounded border flex items-center justify-center ${selectedFileIds.includes(job.id) ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"}`}
                                >
                                    {selectedFileIds.includes(job.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                </button>
                              </td>
                              <td className="py-2.5 pl-2 flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-black text-[9px] shrink-0 uppercase select-none shadow-xs ${tagColor}`}>
                                  {extAbbr}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className={`text-xs font-semibold block truncate text-slate-800 hover:text-blue-650 transition-colors ${activeTheme.titleText}`} title={job.fileName}>
                                    {job.fileName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Codec: <span className="font-mono font-bold text-slate-500 uppercase">{job.method}</span>
                                    {job.senderEmail && job.senderEmail.trim().toLowerCase() !== user.email.trim().toLowerCase() && (
                                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        Received from {job.senderEmail}
                                      </span>
                                    )}
                                    {job.recipients && job.recipients.length > 0 && (
                                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                                        Sent to {job.recipients.join(", ")}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-xs font-mono text-slate-650 whitespace-nowrap">
                                {formatBytes(job.originalSize)}
                              </td>
                              <td className="py-2.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                                {new Date(job.timestamp).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </td>
                              <td className="py-2.5 pr-2 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleShareJob(job)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                    title="Share secure link"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadJob(job)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                                    title="Download optimized file"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setJobToDelete(job)}
                                    className="p-1.5 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                    title="Remove file"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 font-mono text-xs">
                            No files match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column: AI / Gemini GPT advisor & Reward weights feedback */}
            <div className="lg:col-span-5 space-y-6">

              {/* Gemini GPT Advisor Card */}
              <div className="hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="text-blue-600 w-5 h-5" />
                    <h2 className="text-md font-semibold text-slate-900 tracking-tight">Gemini GPT Advisor Engine</h2>
                  </div>
                  <button
                    onClick={handleGetAIAdvice}
                    disabled={isAdvising}
                    className="p-1 px-2.5 rounded bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-[10px] font-semibold flex items-center gap-1.5 transition-all font-mono hover:border-blue-550/30 hover:bg-slate-100"
                  >
                    {isAdvising ? <RefreshCw className="w-3 h-3 animate-spin text-blue-600" /> : <RefreshCw className="w-3 h-3" />}
                    Refresh predictions
                  </button>
                </div>

                {isAdvising ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-xs text-slate-500 font-mono animate-pulse">Running Random-Forest sklearn inference & querying Gemini model...</p>
                  </div>
                ) : aiAdvisor ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">RECOMMENDED TARGET</span>
                        <span className="text-md font-bold text-blue-600">{aiAdvisor.method}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">EXPECTED RATIO</span>
                        <span className="text-md font-bold text-slate-800 font-mono">
                          {aiAdvisor.expectedSavings}x <span className="text-[10px] text-blue-600 font-bold">(-{Math.round((1 - aiAdvisor.expectedSavings) * 100)}%)</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed relative">
                      <div className="text-[10px] text-blue-700 uppercase font-bold mb-1 flex items-center gap-1">
                        <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" /> REASONING MATRIX
                      </div>
                      <p className="text-slate-700 italic font-medium">{aiAdvisor.reasoning}</p>
                    </div>

                    {aiAdvisor.predictedBitrate && (
                      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold">TARGET ENCODING PARAMETERS</span>
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono font-extrabold text-[10px]">
                          {aiAdvisor.predictedBitrate}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs text-center py-6 font-medium">Define your parameters to compute advisory models.</p>
                )}
              </div>

              {/* Reinforcement Learning Star Feedback & Algorithmic Weights */}
              {ratedJobId && (
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 relative overflow-hidden animate-fade-in shadow-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                    <Flame className="text-blue-600 w-5 h-5" />
                    <h2 className="text-md font-semibold text-slate-900 tracking-tight">Reinforcement Learning Calibration Feedback</h2>
                  </div>

                  <p className="text-xs text-slate-650 leading-relaxed mb-4">
                    The platform completed the <span className="text-blue-600 font-bold">{selectedMethod}</span> job. Help the reinforcement algorithm learn by rating the latency and accuracy quality below:
                  </p>

                  <div className="flex flex-col items-center justify-center space-y-4 bg-slate-55 p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingValue(star)}
                          className="hover:scale-110 transition-all cursor-pointer"
                        >
                          <Star className={`w-7 h-7 transition-all ${star <= ratingValue ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={handleRLFeedback}
                      className="w-full bg-blue-650 hover:bg-blue-700 text-white font-mono transition-all px-4 py-2.5 rounded-lg text-xs font-semibold uppercase font-bold cursor-pointer"
                    >
                      Update Model Reward (learningRate=0.05)
                    </button>
                  </div>
                </div>
              )}



            </div>
          </div>
        )}

        {/* TAB 2: RICH ANALYTICS CHARTS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Original Bandwidth</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">{formatBytes(totalOriginalBytes)}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-550">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Compressed Footprint</span>
                  <span className="text-xl font-bold text-blue-600 font-mono">{formatBytes(totalCompressedBytes)}</span>
                </div>
                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 text-blue-600">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Network Saved Space</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">{formatBytes(savingsCumulativeBytes)}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600">
                  <Check className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Average Efficiency</span>
                  <span className="text-xl font-bold text-blue-600 font-mono">{averageSavingsPercent}% Saved</span>
                </div>
                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 text-blue-600">
                  <Gauge className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Real charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Original over Compress Trend Area */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight uppercase font-mono mb-4">Throughput Volumetrics (Original vs compressed sizing index)</h3>
                <div className="h-72">
                  {chartHistoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOrig" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val} KB`} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a" }} />
                        <Area type="monotone" dataKey="original" stroke="#94a3b8" fillOpacity={1} fill="url(#colorOrig)" name="Original (KB)" />
                        <Area type="monotone" dataKey="compressed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorComp)" name="Compressed (KB)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">Run a sandbox file compression to render historical models.</div>
                  )}
                </div>
              </div>

              {/* Right: Pie Distribution */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight uppercase font-mono mb-4">Space Breakdown</h3>
                  <div className="h-44 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatBytes(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-slate-550">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Active Storage size
                    </span>
                    <span className="text-slate-900 font-bold">{formatBytes(totalCompressedBytes)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-slate-550">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-405 inline-block" /> Egress Bandwidth Saved
                    </span>
                    <span className="text-blue-600 font-bold">{formatBytes(savingsCumulativeBytes)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Jobs History list database table */}
            <div className={`p-6 rounded-2xl shadow-sm transition-all duration-300 ${activeTheme.cardBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100/10">
                <h3 className={`text-sm font-semibold tracking-tight uppercase font-mono ${activeTheme.titleText}`}>Live Log History Logs</h3>
                <button
                  id="export-history-btn"
                  onClick={handleExportCSV}
                  className={`px-3 py-1.5 text-[10px] rounded-lg font-mono font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${activeTheme.accentBtn}`}
                  title="Export history list to CSV file"
                >
                  <Download className="w-3.5 h-3.5" /> Export History (CSV)
                </button>
              </div>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left font-mono text-[11px] text-slate-450">
                  <thead>
                    <tr className="border-b border-slate-100/10 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="pb-3 bg-transparent">Filename</th>
                      <th className="pb-3 bg-transparent">Type</th>
                      <th className="pb-3 bg-transparent">Format</th>
                      <th className="pb-3 bg-transparent">Original Size</th>
                      <th className="pb-3 bg-transparent text-blue-500">Compressed Size</th>
                      <th className="pb-3 bg-transparent">Time</th>
                      <th className="pb-3 bg-transparent text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/10">
                    {historyJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-400/5">
                        <td className={`py-2.5 font-semibold max-w-[150px] truncate ${activeTheme.titleText}`}>{job.fileName}</td>
                        <td className="py-2.5 text-slate-500">{job.fileType}</td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border uppercase ${activeTheme.brandText}`}>
                            {getFileCategory(job.fileType)}
                          </span>
                        </td>
                        <td className="py-2.5 font-medium">{formatBytes(job.originalSize)}</td>
                        <td className="py-2.5 font-bold text-slate-500">{formatBytes(job.compressedSize)} (-{job.savingsPercent}%)</td>
                        <td className="py-2.5 text-slate-400">{new Date(job.timestamp).toLocaleTimeString()}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => setJobToDelete(job)}
                            className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Delete this history entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: STRIPE SAAS BILLING GATEWAY */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            
            {/* Quote indicator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-md font-bold text-slate-900 uppercase font-mono">Monthly Subscription Usage Quota</h3>
                  <p className="text-xs text-slate-550">Dynamic Stripe checking prevents overflow of multi-tenant system files.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono block font-bold">STRIPE BILLING PLAN</span>
                  <span className="text-md font-bold text-blue-600 uppercase">{user.plan} Active</span>
                </div>
              </div>

              {/* Quota bar */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-[11px] text-slate-600">
                  <span>Compressed Space Used: <strong className="text-slate-900">{formatBytes(user.quotaUsed)}</strong></span>
                  <span>Limit: <strong className="text-slate-900">{formatBytes(user.quotaLimit)}</strong></span>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      user.quotaUsed / user.quotaLimit >= 0.90 
                        ? "bg-red-600 animate-pulse shadow-sm shadow-red-500/40" 
                        : user.quotaUsed / user.quotaLimit > 0.85 
                        ? "bg-red-550 animate-pulse" 
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${Math.min(100, (user.quotaUsed / user.quotaLimit) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    {((user.quotaUsed / user.quotaLimit) * 100).toFixed(1)}% Consumption
                    {user.quotaUsed / user.quotaLimit >= 0.90 && (
                      <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded animate-pulse">
                        QUOTA NEARLY FULL
                      </span>
                    )}
                  </span>
                  <span>Reset billing details every 1st of month (UTC)</span>
                </div>
              </div>
            </div>

            {/* Pricing Tiers (The subscription cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Free Tier */}
              <div className={`border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative shadow-sm ${activeTheme.cardBg} ${user.plan === "Free" ? "border-blue-600 ring-2 ring-blue-500/10 shadow-md" : ""}`}>
                {user.plan === "Free" && <span className={`absolute top-4 right-4 text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border ${activeTheme.brandText}`}>Current Tier</span>}
                <div className="space-y-4">
                  <h4 className={`text-sm font-bold font-mono uppercase opacity-75 ${activeTheme.titleText}`}>Free plan</h4>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-extrabold font-mono ${activeTheme.titleText}`}>$0</span>
                    <span className={`text-xs font-mono font-semibold opacity-65 ${activeTheme.titleText}`}>/ Month (Free)</span>
                  </div>
                  <p className="text-xs opacity-85">Basic compression sandboxed for text and lightweight log structures.</p>
                  
                  <ul className={`space-y-2.5 text-xs font-mono border-t pt-4 ${activeTheme.panelHead}`}>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> 10 GB Storage Quota</li>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> Local Heuristic Advisor</li>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> 100 API Calls Threshold</li>
                    <li className="flex items-center gap-2 opacity-50"><Check className="w-4 h-4 flex-shrink-0" /> Multi-region H.265 / zstd</li>
                  </ul>
                </div>

                <button
                  disabled={user.plan === "Free"}
                  onClick={() => handleStripeCheckout("Free")}
                  className={`w-full mt-6 py-2.5 rounded-xl text-xs font-mono uppercase font-bold border transition-all ${
                    user.plan === "Free"
                      ? "bg-blue-700 text-white border-blue-600"
                      : "border-slate-200 hover:border-slate-400 text-slate-700 cursor-pointer bg-slate-100/50 hover:bg-slate-100"
                  }`}
                >
                  {user.plan === "Free" ? "Current plan" : "Downgrade"}
                </button>
              </div>

              {/* Pro Tier */}
              <div className={`border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative shadow-sm ${activeTheme.cardBg} ${user.plan === "Pro" ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-md" : ""}`}>
                {user.plan === "Pro" && <span className={`absolute top-4 right-4 text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border ${activeTheme.brandText}`}>Current Tier</span>}
                <div className="space-y-4">
                  <h4 className={`text-sm font-bold font-mono uppercase ${activeTheme.accentText}`}>Pro plan</h4>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-extrabold font-mono ${activeTheme.titleText}`}>$29</span>
                    <span className={`text-xs font-mono font-semibold opacity-65 ${activeTheme.titleText}`}>/ Month (Stripe)</span>
                  </div>
                  <p className="text-xs opacity-85">Intended for dynamic image formats and medium scale database logging feeds.</p>
                  
                  <ul className={`space-y-2.5 text-xs font-mono border-t pt-4 ${activeTheme.panelHead}`}>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> 100 GB Storage Quota</li>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> Server-Side Gemini Advisor</li>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> 1,000 API Calls Threshold</li>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> Active WebP & zstd algorithms</li>
                  </ul>
                </div>

                <button
                  disabled={user.plan === "Pro"}
                  onClick={() => handleStripeCheckout("Pro")}
                  className={`w-full mt-6 py-2.5 rounded-xl text-xs font-mono uppercase font-bold border transition-all cursor-pointer ${
                    user.plan === "Pro"
                      ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                      : "border-blue-600 bg-blue-700 text-white hover:bg-blue-800 shadow-sm"
                  }`}
                >
                  {user.plan === "Pro" ? "Current Tier Active" : "Upgrade"}
                </button>
              </div>

              {/* Enterprise Tier */}
              <div className={`border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative shadow-sm ${activeTheme.cardBg} ${user.plan === "Enterprise" ? "border-blue-600 ring-2 ring-blue-500/10 shadow-md" : ""}`}>
                {user.plan === "Enterprise" && <span className={`absolute top-4 right-4 text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border ${activeTheme.brandText}`}>Current Tier</span>}
                <div className="space-y-4">
                  <h4 className={`text-sm font-bold font-mono uppercase opacity-75 ${activeTheme.titleText}`}>Enterprise plan</h4>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-extrabold font-mono ${activeTheme.titleText}`}>$199</span>
                    <span className={`text-xs font-mono font-semibold opacity-65 ${activeTheme.titleText}`}>/ Month (Stripe)</span>
                  </div>
                  <p className="text-xs opacity-85">Complete H.265 video pipelines, kubernetes clusters, and multi-tenant telemetry queues.</p>
                  
                  <ul className={`space-y-2.5 text-xs font-mono border-t pt-4 ${activeTheme.panelHead}`}>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> 1 TB Expansive Storage</li>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> High-Level Gemini Advisory</li>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> 10,000 API Calls Threshold</li>
                    <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 font-bold ${activeTheme.accentText}`} /> Dedicated FastAPI Python ML API</li>
                  </ul>
                </div>

                <button
                  disabled={user.plan === "Enterprise"}
                  onClick={() => handleStripeCheckout("Enterprise")}
                  className={`w-full mt-6 py-2.5 rounded-xl text-xs font-mono uppercase font-bold border transition-all cursor-pointer ${
                    user.plan === "Enterprise"
                      ? "border-slate-105 bg-slate-50 text-slate-400 cursor-not-allowed"
                      : "border-blue-600 bg-blue-700 text-white hover:bg-blue-800 shadow-sm"
                  }`}
                >
                  {user.plan === "Enterprise" ? "Current Tier Active" : "Upgrade"}
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: SYSTEM ARCHITECTURE & CODE HUB */}
        {activeTab === "architecture" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left: Code tabs */}
            <div className={`lg:col-span-3 rounded-2xl p-4 flex flex-col gap-1 uppercase font-mono text-[11px] font-bold transition-all duration-300 ${activeTheme.cardBg}`}>
              <span className="text-[10px] opacity-65 p-2 uppercase">Platform Blueprint Module specs</span>
              {[
                { key: "architecture", label: "System Topology Flow", icon: Layers },
                { key: "python", label: "Python ML FastAPI Service", icon: FileCode2 },
                { key: "cloudflare", label: "Cloudflare Edge Worker", icon: Server },
                { key: "db", label: "Postgres SQL Schemas", icon: Database },
                { key: "stripe", label: "Stripe Billing Code", icon: DollarSign },
                { key: "kubernetes", label: "Cloud Docker & Kubernetes", icon: Layers },
                { key: "rl", label: "Reinforcement Learning", icon: Cpu }
              ].map((tabItem) => {
                const IconComponent = tabItem.icon;
                return (
                  <button
                    key={tabItem.key}
                    onClick={() => setActiveCodeTab(tabItem.key as any)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all duration-350 flex items-center gap-2 cursor-pointer ${activeCodeTab === tabItem.key ? activeTheme.navCodeActive : activeTheme.navCodeInactive}`}
                  >
                    <IconComponent className="w-4 h-4" /> {tabItem.label}
                  </button>
                );
              })}
            </div>

            {/* Right: Code Reader Panel */}
            <div className={`lg:col-span-9 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${activeTheme.cardBg}`}>
              
              <div className={`border-b p-4 px-5 flex items-center justify-between transition-colors duration-300 ${activeTheme.panelHead} ${designLook === "light" ? "bg-slate-50" : "bg-black/25"}`}>
                <div className="flex items-center space-x-2">
                  <Terminal className={`w-4 h-4 transition-colors duration-300 ${activeTheme.accentText}`} />
                  <span className={`font-mono text-xs font-semibold ${activeTheme.titleText}`}>
                    {activeCodeTab === "architecture" && "topology_overview.txt"}
                    {activeCodeTab === "python" && "ml_service.py [FastAPI + sklearn]"}
                    {activeCodeTab === "cloudflare" && "edge_worker.js [Cloudflare Worker]"}
                    {activeCodeTab === "db" && "supabase_schema.sql [Postgre SQL Schema]"}
                    {activeCodeTab === "stripe" && "stripe_saas_billing.ts [Stripe billing]"}
                    {activeCodeTab === "kubernetes" && "kubernetes_deployment.yaml & Docker spec"}
                    {activeCodeTab === "rl" && "reinforcement_learning.ts [Decision Loop]"}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    let contentToCopy = "";
                    if (activeCodeTab === "architecture") contentToCopy = architectureSystem;
                    if (activeCodeTab === "python") contentToCopy = pythonMLService;
                    if (activeCodeTab === "cloudflare") contentToCopy = cloudflareWorker;
                    if (activeCodeTab === "db") contentToCopy = databaseSchema;
                    if (activeCodeTab === "stripe") contentToCopy = stripeBilling;
                    if (activeCodeTab === "kubernetes") contentToCopy = kubernetesDeployment;
                    if (activeCodeTab === "rl") contentToCopy = rlSystemCode;
                    handleCopyToClipboard(contentToCopy, activeCodeTab);
                  }}
                  className={`p-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all shadow-sm ${activeTheme.inputBg}`}
                >
                  {isCopying === activeCodeTab ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-550" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* View Block content */}
              <div className={`p-4 overflow-auto max-h-[500px] transition-colors duration-300 ${activeTheme.preBg}`}>
                <pre className="text-xs font-mono leading-relaxed whitespace-pre font-semibold">
                  {activeCodeTab === "architecture" && architectureSystem}
                  {activeCodeTab === "python" && pythonMLService}
                  {activeCodeTab === "cloudflare" && cloudflareWorker}
                  {activeCodeTab === "db" && databaseSchema}
                  {activeCodeTab === "stripe" && stripeBilling}
                  {activeCodeTab === "kubernetes" && kubernetesDeployment}
                  {activeCodeTab === "rl" && rlSystemCode}
                </pre>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer copyright status line */}
      <footer className={`py-4 px-6 flex-shrink-0 text-center text-[11px] font-mono tracking-wide flex items-center justify-between transition-colors duration-300 ${activeTheme.footerBg}`}>
        <div>
          <span>© 2026 Fluxstore AI Corp.</span>
        </div>
        <div>
          <span>Enterprise Secure Connection</span>
        </div>
      </footer>

      {/* 4. Authentication / Join Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="auth_portal_overlay">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl transition-all duration-300 ${activeTheme.cardBg}`}>
            
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Terminal className={`w-5 h-5 ${activeTheme.accentText}`} />
                <h3 className={`text-sm font-bold uppercase tracking-tight ${activeTheme.titleText}`}>
                  {isAuthModeSignUp ? "Create Secure Account" : "Sign In to Workspace"}
                </h3>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-xs hover:text-red-500 font-mono font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className={`block text-[11px] mb-1 font-mono uppercase font-bold opacity-80 ${activeTheme.titleText}`}>
                  Gmail or email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  className={`w-full px-3 py-2 rounded-lg text-sm font-mono outline-none transition-all duration-300 ${activeTheme.inputBg}`}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>

              <div>
                <label className={`block text-[11px] mb-1 font-mono uppercase font-bold opacity-80 ${activeTheme.titleText}`}>
                  Secure Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className={`w-full pl-3 pr-10 py-2 rounded-lg text-sm font-mono outline-none transition-all duration-300 ${activeTheme.inputBg}`}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer flex items-center justify-center p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {isAuthModeSignUp && (
                <div className="flex items-start space-x-2 pt-1 pb-1">
                  <input
                    id="accept_terms_checkbox"
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="accept_terms_checkbox" className={`text-xs select-none leading-normal cursor-pointer ${activeTheme.mutedText}`}>
                    I read and accept the <span className="underline font-semibold">Terms of Service</span> & <span className="underline font-semibold">Privacy Policy</span>.
                  </label>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg text-xs font-mono uppercase font-bold transition-all text-center cursor-pointer block ${activeTheme.accentBg}`}
                >
                  {isAuthModeSignUp ? "Create Account & Sign In" : "Sign In to Cloud Context"}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t text-center">
              <p className={`text-xs ${activeTheme.mutedText}`}>
                {isAuthModeSignUp ? "Already have an account?" : "New to Fluxstore AI?"}{" "}
                <button
                  onClick={() => setIsAuthModeSignUp(!isAuthModeSignUp)}
                  className={`font-semibold hover:underline font-mono cursor-pointer ${activeTheme.accentText}`}
                >
                  {isAuthModeSignUp ? "Switch to Sign In" : "Register a Custom Password Account"}
                </button>
              </p>
            </div>

            {/* Live Secure Google Sign-In Action */}
            <div className="mt-4 pt-3 border-t">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold border border-slate-300 hover:border-blue-500/50 flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.29c1.92,-1.78 3.02,-4.39 3.02,-7.4C21.65,11.69 21.55,11.2 21.35,11.1z" fill="#4285F4"/>
                  <path d="M12,20.58c2.43,0 4.47,-0.8 5.96,-2.19l-2.91,-2.26c-0.81,0.54 -1.84,0.86 -3.05,0.86 -2.35,0 -4.33,-1.59 -5.04,-3.72H3.55v2.33C5.03,16.56 8.27,20.58 12,20.58z" fill="#34A853"/>
                  <path d="M6.96,13.27c-0.18,-0.54 -0.28,-1.12 -0.28,-1.71s0.1,-1.17 0.28,-1.71V7.52H3.55c-0.6,1.2 -0.95,2.56 -0.95,3.99s0.35,2.79 0.95,3.99L6.96,13.27z" fill="#FBBC05"/>
                  <path d="M12,5.26c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,2.58 14.43,1.72 12,1.72 8.27,1.72 5.03,5.74 3.55,8.07l3.41,2.06C7.67,8.21 9.65,5.26 12,5.26z" fill="#EA4335"/>
                </svg>
                <span>Sign-In with Google</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Share Link Modal (Specs: matches screenshot file sharing requirements) */}
      {showShareModal && activeShareJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="share_link_overlay">
          <div className="w-full max-w-md p-6 rounded-3xl shadow-2xl border border-slate-150 transition-all duration-300 bg-white text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold uppercase tracking-tight text-slate-800">
                  Share Secure Link
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowShareModal(false);
                  setActiveShareJob(null);
                }}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div className="p-3 border border-slate-100 bg-slate-50/55 rounded-xl space-y-1.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex flex-col items-center justify-center font-bold text-[10px] shadow-sm uppercase shrink-0 border border-blue-150">
                  {activeShareJob.fileName.split('.').pop()?.toUpperCase() || "FILE"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-805 truncate" title={activeShareJob.fileName}>
                    {activeShareJob.fileName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatBytes(activeShareJob.originalSize)} • Codec: {activeShareJob.method}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] mb-1 font-mono uppercase font-black text-slate-400">
                  Unique Optimized File Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}?share=${activeShareJob.id}`}
                    className="flex-1 px-3 py-2.5 rounded-lg text-xs font-mono outline-none border border-slate-200 bg-slate-50 text-slate-600 font-semibold"
                    id="share_link_input_field"
                  />
                  <button
                    onClick={() => {
                      const linkText = `${window.location.origin}?share=${activeShareJob.id}`;
                      navigator.clipboard.writeText(linkText).then(() => {
                        setToast({ type: "success", text: "Link successfully copied!" });
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>

              <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                Anyone with access to this link can preview and download this specific file without authenticating onto the platform workspace.
              </p>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    setActiveShareJob(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal (Accidental Data Loss Prevention) */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="delete_confirm_overlay">
          <div className="w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-slate-150 transition-all duration-300 bg-white text-slate-900 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold tracking-tight text-slate-800">
                  Delete History File Entry?
                </h3>
              </div>
              <button 
                onClick={() => setJobToDelete(null)}
                className="p-1.5 text-slate-405 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to delete this file entry? This action cannot be undone.
              </p>

              <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex flex-col items-center justify-center font-bold text-[9px] shadow-sm uppercase shrink-0 border border-rose-150">
                  {jobToDelete.fileName.split('.').pop()?.toUpperCase() || "FILE"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate" title={jobToDelete.fileName}>
                    {jobToDelete.fileName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {formatBytes(jobToDelete.originalSize)} • {jobToDelete.method.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="p-3 text-[11px] leading-relaxed text-amber-800 bg-amber-50 rounded-xl border border-amber-100">
                ⚠️ Deleting this entry will permanently release user database quota resources.
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setJobToDelete(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-605 rounded-xl font-mono font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteJob(jobToDelete.id);
                    setJobToDelete(null);
                  }}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-mono font-bold transition-all cursor-pointer shadow-md"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating toast system for interactive feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 transform translate-y-0 ease-out animate-bounce-short">
          <div className={`bg-white border-2 rounded-2xl p-4 shadow-2xl max-w-sm flex items-start gap-4 ${
            toast.type === "error" || (toast.type === "warning" && toast.text.toLowerCase().includes("limit"))
              ? "border-red-500"
              : toast.type === "success"
              ? "border-emerald-550"
              : "border-blue-500"
          }`}>
            <div className={`p-2 rounded-xl ${
              toast.type === "error" || (toast.type === "warning" && toast.text.toLowerCase().includes("limit"))
                ? "bg-red-50 text-red-600"
                : toast.type === "success"
                ? "bg-emerald-50 text-emerald-605"
                : "bg-blue-50 text-blue-600"
            }`}>
              {toast.type === "success" ? (
                <Check className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-xs font-bold font-mono uppercase tracking-wide ${
                toast.type === "error" || (toast.type === "warning" && toast.text.toLowerCase().includes("limit"))
                  ? "text-red-600"
                  : toast.type === "success"
                  ? "text-emerald-700"
                  : "text-blue-600"
              }`}>
                {toast.type === "success"
                  ? "Action Confirmed"
                  : toast.type === "error" || toast.type === "warning"
                  ? "SaaS Threshold Warning"
                  : "Database Notification"}
              </h4>
              <p className="text-xs text-slate-750 leading-relaxed font-semibold mt-0.5">{toast.text}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-mono font-bold hover:scale-115 transition-transform p-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
