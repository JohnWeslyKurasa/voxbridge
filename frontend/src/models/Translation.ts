import mongoose, { Schema, Document } from "mongoose";

/**
 * Translation Interface for TypeScript
 *
 * Stores everything produced by the VoxBridge AI pipeline:
 *  - Original Whisper transcript + segments
 *  - NLLB-200 translated text + segments (with timestamps)
 *  - Piper TTS generated audio URL (Phase 6)
 *  - FFmpeg merged output video URL (Phase 7)
 *  - SRT subtitle content (downloadable)
 *  - Detected source language from Whisper
 */
export interface ITranslation extends Document {
  project: mongoose.Types.ObjectId;
  // ── Transcription (Faster-Whisper) ──────────────────────────
  transcriptText: string;
  detectedLanguage: string;          // ISO 639-1 code, e.g. "en", "hi"
  // ── Translation (Meta NLLB-200) ─────────────────────────────
  translatedText: string;
  segments: { start: number; end: number; text: string }[];
  translatedSegments: { start: number; end: number; text: string }[];
  // ── TTS (Piper TTS — Phase 6) ────────────────────────────────
  ttsAudioUrl: string;               // Cloudinary URL to generated MP3
  ttsStatus: "pending" | "processing" | "completed" | "failed" | "skipped";
  // ── Video Merge (FFmpeg — Phase 7) ───────────────────────────
  outputVideoUrl: string;            // Cloudinary URL to merged MP4
  videoMergeStatus: "pending" | "processing" | "completed" | "failed" | "skipped";
  // ── Downloads ────────────────────────────────────────────────
  srtContent: string;                // Full SRT file content (generated server-side)
  // ── Legacy voice settings ────────────────────────────────────
  voiceSettings: {
    preserveVoice: boolean;
    cloneId?: string;
    gender: "original" | "male" | "female";
  };
  subtitles: {
    srtUrl?: string;
    vttUrl?: string;
    txtUrl?: string;
  };
  outputMedia?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Translation Schema Definition
 *
 * Why it is needed:
 * - Stores the complete output of the VoxBridge AI pipeline for each project.
 * - Links transcription, translation, TTS audio, and merged video to one document.
 *
 * Connections:
 * - Links to `Project` model via `project` ObjectId.
 * - Links to `MediaFile` model via `outputMedia` ObjectId.
 */
const TranslationSchema: Schema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    // ── Transcription ──────────────────────────────────────────
    transcriptText: { type: String, default: "" },
    detectedLanguage: { type: String, default: "" },
    // ── Translation ───────────────────────────────────────────
    translatedText: { type: String, default: "" },
    segments: [
      {
        start: { type: Number, required: true },
        end:   { type: Number, required: true },
        text:  { type: String, required: true },
      },
    ],
    translatedSegments: [
      {
        start: { type: Number, required: true },
        end:   { type: Number, required: true },
        text:  { type: String, required: true },
      },
    ],
    // ── TTS (Phase 6) ─────────────────────────────────────────
    ttsAudioUrl: { type: String, default: "" },
    ttsStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "skipped"],
      default: "pending",
    },
    // ── Video Merge (Phase 7) ─────────────────────────────────
    outputVideoUrl: { type: String, default: "" },
    videoMergeStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "skipped"],
      default: "pending",
    },
    // ── Downloads ─────────────────────────────────────────────
    srtContent: { type: String, default: "" },
    // ── Legacy fields (kept for backward compatibility) ────────
    voiceSettings: {
      preserveVoice: { type: Boolean, default: true },
      cloneId:       { type: String, default: "" },
      gender: {
        type: String,
        enum: ["original", "male", "female"],
        default: "original",
      },
    },
    subtitles: {
      srtUrl: { type: String, default: "" },
      vttUrl: { type: String, default: "" },
      txtUrl: { type: String, default: "" },
    },
    outputMedia: {
      type: Schema.Types.ObjectId,
      ref: "MediaFile",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Translation ||
  mongoose.model<ITranslation>("Translation", TranslationSchema);
