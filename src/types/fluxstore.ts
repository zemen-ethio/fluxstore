export type FileType = "video" | "audio" | "text" | "binary" | "image";

export type ImageType = "photo" | "ui" | "document" | "screenshot" | "thumbnail" | "other";

export interface CompressionMeta {
  fileType: FileType;
  fileSize: number;
  priority: "speed" | "balance" | "max_compression";
  network: "fast" | "slow" | "unstable";
}

export interface ImageMeta extends CompressionMeta {
  imageType: ImageType;
  hasText: boolean;
}

export interface JobDefinition {
  id: string;
  rawFileUrl: string;
  meta: CompressionMeta;
  status: "pending" | "processing" | "completed" | "failed";
}
