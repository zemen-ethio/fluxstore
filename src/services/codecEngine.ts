import { CompressionMeta, ImageMeta } from "../types/fluxstore";

export type CodecStrategy = 
  | "H265_FAST" 
  | "AV1_AI_ENHANCED" 
  | "H265_LOW_BITRATE" 
  | "AV1_STANDARD" 
  | "ENCODEC_NEURAL" 
  | "AI_SEMANTIC_COMPRESSION" 
  | "ZSTD_LEVEL_10";

export type ImageCodecStrategy =
  | "WEBP"
  | "AVIF"
  | "AVIF_AI_RECON"
  | "PNG_OCR"
  | "JPEG_XL";

export function chooseCodec(meta: CompressionMeta): CodecStrategy {
  if (meta.fileType === "video") {
    if (meta.priority === "speed") return "H265_FAST";
    if (meta.priority === "max_compression") return "AV1_AI_ENHANCED";
    if (meta.network === "slow") return "H265_LOW_BITRATE";
    return "AV1_STANDARD";
  }

  if (meta.fileType === "audio") return "ENCODEC_NEURAL";
  if (meta.fileType === "text") return "AI_SEMANTIC_COMPRESSION";
  
  // Default for binary/other
  return "ZSTD_LEVEL_10";
}

export function chooseImageCodec(meta: ImageMeta): ImageCodecStrategy {
  if (meta.imageType === "thumbnail") return "WEBP";
  if (meta.imageType === "document") return "PNG_OCR";
  if (meta.priority === "max_compression") return "AVIF_AI_RECON";
  if (meta.network === "slow" || meta.priority === "speed") return "WEBP";
  return "AVIF";
}
