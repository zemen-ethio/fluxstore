import express, { Express } from "express";
import zlib from "zlib";
import { GoogleGenAI } from "@google/genai";
import { CompressionMeta, ImageMeta } from "../types/fluxstore";
import { chooseImageCodec } from "../services/codecEngine";

// Shared services (will be passed in)
export function setupRoutes(app: Express, services: { 
  db: any, 
  ai: GoogleGenAI | null, 
  usersStore: any, 
  compressionJobs: any[], 
  usageLogs: any[], 
  rlWeights: any, 
  saveUser: Function,
  saveJob: Function,
  deleteJob: Function,
  saveLog: Function,
  getActiveUser: Function
}) {
  const { db, ai, usersStore, compressionJobs, usageLogs, rlWeights, saveUser, saveJob, deleteJob, saveLog, getActiveUser } = services;

  // Image analysis and routing engine
  app.post("/api/analyze-image", async (req, res) => {
    const meta = req.body as ImageMeta;
    const strategy = chooseImageCodec(meta);
    res.json({ strategy, msg: "Image processed by AI classifier" });
  });

  // Placeholder for relocated routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });
}
