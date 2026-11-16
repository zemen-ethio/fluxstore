import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Upload, Search } from "lucide-react";

interface CompressionJob {
  id: string;
  fileName: string;
  title?: string;
  fileType?: string;
  originalSize: number;
  compressedSize: number;
  method?: string;
  compressionRatio?: number;
  savingsPercent?: number;
  timestamp?: any;
}

interface StorageVisualizationProps {
  jobs: CompressionJob[];
  onUploadClick?: () => void;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const idx = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, idx);
  return `${value >= 100 || idx === 0 ? value.toFixed(0) : value.toFixed(2)} ${units[idx]}`;
}

function getJobSavingsPercent(job: CompressionJob): number {
  const orig = Number(job.originalSize) || 0;
  const comp = Number(job.compressedSize) || 0;
  if (orig > 0) {
    return Math.max(0, Math.min(100, ((orig - comp) / orig) * 100));
  }
  return Math.max(0, Math.min(100, Number(job.savingsPercent) || 0));
}

function formatMethodLabel(method?: string): string {
  if (!method) return "Standard";
  if (method === "ai") return "AI Optimized";
  if (method === "fast") return "Fast Mode";
  return method;
}

export const StorageVisualization = ({
  jobs,
  onUploadClick,
}: StorageVisualizationProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "ai" | "fast">("all");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const nameMatch = (job.title || job.fileName || "")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());
      const methodMatch =
        methodFilter === "all" ||
        (methodFilter === "ai" && (job.method === "ai" || job.method === "zstd" || job.method === "WebP" || job.method === "H.265")) ||
        (methodFilter === "fast" && (job.method === "fast" || job.method === "zlib"));
      return nameMatch && methodMatch;
    });
  }, [jobs, searchQuery, methodFilter]);

  const metrics = useMemo(() => {
    const totalOriginal = filteredJobs.reduce(
      (sum, j) => sum + Math.max(0, Number(j.originalSize) || 0),
      0
    );
    const totalCompressed = filteredJobs.reduce(
      (sum, j) => sum + Math.max(0, Number(j.compressedSize) || 0),
      0
    );
    const totalSaved = Math.max(0, totalOriginal - totalCompressed);
    const savingsPercent =
      totalOriginal > 0 ? (totalSaved / totalOriginal) * 100 : 0;
    const compressedRatioPercent =
      totalOriginal > 0 ? (totalCompressed / totalOriginal) * 100 : 0;

    let bestJob: CompressionJob | null = null;
    let bestPct = 0;
    for (const job of filteredJobs) {
      const pct = getJobSavingsPercent(job);
      if (!bestJob || pct > bestPct) {
        bestJob = job;
        bestPct = pct;
      }
    }

    return {
      totalOriginal,
      totalCompressed,
      totalSaved,
      savingsPercent,
      compressedRatioPercent,
      bestJob,
      bestPct,
    };
  }, [filteredJobs]);

  const donutData = useMemo(() => {
    if (metrics.totalOriginal <= 0) {
      return [
        { name: "Space Saved", value: 0 },
        { name: "Compressed Size", value: 1 },
      ];
    }
    return [
      { name: "Space Saved", value: metrics.totalSaved },
      { name: "Compressed Size", value: metrics.totalCompressed },
    ];
  }, [metrics]);

  const barData = useMemo(() => {
    return filteredJobs
      .slice(0, 8)
      .reverse()
      .map((job) => {
        const label = job.title || job.fileName || "File";
        const shortName =
          label.length > 14 ? `${label.slice(0, 12)}…` : label;
        const orig = Math.max(0, Number(job.originalSize) || 0);
        const comp = Math.max(0, Number(job.compressedSize) || 0);
        return {
          name: shortName,
          fullName: label,
          originalBytes: orig,
          compressedBytes: comp,
          savedBytes: Math.max(0, orig - comp),
          savingsPercent: getJobSavingsPercent(job),
        };
      });
  }, [filteredJobs]);

  if (jobs.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-xl p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          No Compression Data Yet
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Upload and transfer a file to compare its original uploaded size against
          its compressed footprint and total percentage saved.
        </p>
        {onUploadClick && (
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={16} />
            Upload First File
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
          {(
            [
              { id: "all", label: "All Transfers" },
              { id: "ai", label: "AI Optimized" },
              { id: "fast", label: "Fast Mode" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMethodFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                methodFilter === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by file name..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Compressed Reduction
          </p>
          <p className="text-3xl font-bold text-emerald-600 mt-1 tabular-nums">
            {metrics.savingsPercent.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            Smaller than original uploaded data
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Original Uploaded Data
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatBytes(metrics.totalOriginal)}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            Across {filteredJobs.length}{" "}
            {filteredJobs.length === 1 ? "file" : "files"} (100% baseline)
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Final Compressed Size
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-1 tabular-nums">
            {formatBytes(metrics.totalCompressed)}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {metrics.compressedRatioPercent.toFixed(1)}% of original payload
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Total Bandwidth Saved
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatBytes(metrics.totalSaved)}
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {metrics.bestJob
              ? `Peak: ${metrics.bestPct.toFixed(1)}% (${metrics.bestJob.title || metrics.bestJob.fileName})`
              : "No matching files"}
          </p>
        </div>
      </div>

      {/* Visual Comparison Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Overall Original vs Compressed Proportion */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Original vs. Compressed Ratio
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Share of original uploaded bytes saved versus retained after compression
            </p>
          </div>

          <div className="relative h-56 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={64}
                  outerRadius={88}
                  paddingAngle={metrics.totalSaved > 0 && metrics.totalCompressed > 0 ? 3 : 0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#2563eb" />
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatBytes(Number(value) || 0)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {metrics.savingsPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">Compressed</span>
            </div>
          </div>

          {/* Explicit 100% Baseline vs Compressed Bar */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">
                  Original Uploaded (100%)
                </span>
                <span className="font-mono text-slate-700 tabular-nums">
                  {formatBytes(metrics.totalOriginal)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-blue-700">
                  Compressed Payload ({metrics.compressedRatioPercent.toFixed(1)}%)
                </span>
                <span className="font-mono text-blue-700 tabular-nums">
                  {formatBytes(metrics.totalCompressed)} ·{" "}
                  <span className="text-emerald-700">
                    -{metrics.savingsPercent.toFixed(1)}% saved
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-emerald-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{
                    width: `${Math.min(100, Math.max(0, metrics.compressedRatioPercent))}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                <span>Saved ({metrics.savingsPercent.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                <span>
                  Compressed ({metrics.compressedRatioPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Per-File Bar Chart */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Original vs. Compressed by File
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Recent uploads comparing initial size against post-compression output
            </p>
          </div>

          {barData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
              No files match your filter criteria.
            </div>
          ) : (
            <div className="flex-1 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(val) => formatBytes(Number(val))}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={68}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const row = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm text-xs space-y-1">
                          <p className="font-semibold text-slate-900">
                            {row.fullName}
                          </p>
                          <p className="text-slate-600 tabular-nums">
                            Original: {formatBytes(row.originalBytes)}
                          </p>
                          <p className="text-blue-600 tabular-nums">
                            Compressed: {formatBytes(row.compressedBytes)}
                          </p>
                          <p className="text-emerald-700 font-medium tabular-nums">
                            Saved: {formatBytes(row.savedBytes)} (
                            {row.savingsPercent.toFixed(1)}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />
                  <Bar
                    dataKey="originalBytes"
                    name="Original Size"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="compressedBytes"
                    name="Compressed Size"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Per-File Compression Breakdown Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              File Compression Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Exact byte comparison and compression percentage for each uploaded file
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {filteredJobs.length} {filteredJobs.length === 1 ? "record" : "records"}
          </span>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No files match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-6">File</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Original Uploaded</th>
                  <th className="py-3 px-4 text-right">Compressed Size</th>
                  <th className="py-3 px-4 text-right">Data Saved</th>
                  <th className="py-3 px-6 text-right">Compressed %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredJobs.map((job) => {
                  const orig = Math.max(0, Number(job.originalSize) || 0);
                  const comp = Math.max(0, Number(job.compressedSize) || 0);
                  const saved = Math.max(0, orig - comp);
                  const pct = getJobSavingsPercent(job);
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-6 font-medium text-slate-900 max-w-[240px] truncate">
                        {job.title || job.fileName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatMethodLabel(job.method)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {formatBytes(orig)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-blue-700 tabular-nums whitespace-nowrap">
                        {formatBytes(comp)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-emerald-700 tabular-nums whitespace-nowrap">
                        {formatBytes(saved)}
                      </td>
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-3">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums w-12 text-right">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
