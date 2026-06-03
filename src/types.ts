export interface User {
  id: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  quotaUsed: number; // in bytes
  quotaLimit: number; // in bytes
  apiCallsUsed: number;
  apiCallsLimit: number;
}

export interface CompressionJob {
  id: string;
  timestamp: string;
  fileName: string;
  fileType: string;
  originalSize: number;
  compressedSize: number;
  method: 'zstd' | 'WebP' | 'H.265' | 'zlib' | 'none';
  compressionRatio: number;
  savingsPercent: number;
  speedMs: number;
  costSpent: number; // simulated dollar cost
  status: 'completed' | 'failed' | 'processing';
  aiRecommended: boolean;
  reasoning?: string;
  storageUrl?: string;
  userId?: string;
  senderEmail?: string;
  recipients?: string[];
}

export interface UsageLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  bytesProcessed: number;
  creditsCost: number;
}

export interface AnalyticsEvent {
  id: string;
  timestamp: string;
  eventType: string;
  payload: Record<string, any>;
}

export interface AIAdvisorResponse {
  method: string;
  expectedSavings: number; // e.g. 0.45 (compressed / original)
  reasoning: string;
  predictedBitrate?: string;
  suggestedQuality?: number;
}

export interface RLWeights {
  zstd: number; // higher = better historical performance
  WebP: number;
  'H.265': number;
  zlib: number;
}
