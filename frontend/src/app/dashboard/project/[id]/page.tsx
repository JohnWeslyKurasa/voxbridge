"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Globe,
  Mic,
  Upload,
  Video,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import AudioPlayer from "@/components/player/AudioPlayer";
import TranscriptViewer from "@/components/player/TranscriptViewer";
import TranslatedVideoDubPlayer from "@/components/player/TranslatedVideoDubPlayer";

/** Type-safe project data structure matching MongoDB population */
interface ProjectDetail {
  _id: string;
  name: string;
  status: "idle" | "processing" | "completed" | "failed";
  targetLanguage: string;
  inputType: "upload_audio" | "upload_video" | "microphone";
  createdAt: string;
  sourceMedia?: {
    cloudinaryUrl: string;
    mediaType: "audio" | "video";
    duration: number;
    size: number;
  };
  translation?: {
    _id: string;
    transcriptText: string;
    detectedLanguage: string;
    translatedText: string;
    segments: { start: number; end: number; text: string }[];
    translatedSegments: { start: number; end: number; text: string }[];
    ttsAudioUrl: string;
    ttsStatus: "pending" | "processing" | "completed" | "failed" | "skipped";
    outputVideoUrl: string;
    videoMergeStatus: "pending" | "processing" | "completed" | "failed" | "skipped";
  };
}

/** Maps inputType to a display icon and label */
const INPUT_TYPE_LABELS: Record<string, { label: string }> = {
  microphone:   { label: "Microphone Recording" },
  upload_audio: { label: "Audio Upload" },
  upload_video: { label: "Video Upload" },
};

/**
 * Project Detail Page — /dashboard/project/[id] (Bright Luxury Theme)
 */
export const dynamic = "force-dynamic";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [triggeringTTS, setTriggeringTTS]     = useState(false);
  const [triggeringMerge, setTriggeringMerge] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      const found = (data.projects as ProjectDetail[]).find((p) => p._id === projectId);
      if (!found) { setNotFound(true); return; }
      setProject(found);
    } catch (e) {
      console.error("Failed to fetch project:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    const interval = setInterval(fetchProject, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const triggerTTS = async () => {
    setTriggeringTTS(true);
    try {
      await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
    } catch (e) {
      console.error("TTS trigger failed:", e);
    } finally {
      setTriggeringTTS(false);
    }
  };

  const triggerVideoMerge = async () => {
    setTriggeringMerge(true);
    try {
      await fetch("/api/video-merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
    } catch (e) {
      console.error("Video merge trigger failed:", e);
    } finally {
      setTriggeringMerge(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 text-[#7B1E3A] animate-spin" />
        <p className="text-sm font-semibold text-[#7A6B6B]">Loading project details...</p>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-[#D4AF7A]" />
        <div className="space-y-1">
          <p className="font-extrabold text-[#2B1B1B]">Project not found</p>
          <p className="text-sm text-[#7A6B6B] font-semibold">This project may have been deleted.</p>
        </div>
        <Link href="/dashboard" className="text-xs font-bold text-[#7B1E3A] hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const inputTypeInfo = INPUT_TYPE_LABELS[project.inputType] || INPUT_TYPE_LABELS.upload_audio;
  const translation   = project.translation;

  const isTranscriptReady = !!translation?.transcriptText;
  const isTTSReady        = translation?.ttsStatus === "completed" && !!translation?.ttsAudioUrl;
  const isTTSProcessing   = translation?.ttsStatus === "processing";
  const isVideoProject    = project.sourceMedia?.mediaType === "video";
  const videoPlaybackUrl  = translation?.outputVideoUrl || project.sourceMedia?.cloudinaryUrl;
  const isVideoReady      = isVideoProject && !!videoPlaybackUrl;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-bold text-[#7A6B6B] hover:text-[#7B1E3A] transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4 text-[#D4AF7A]" />
          Back to Dashboard
        </Link>
        <button
          onClick={fetchProject}
          className="flex items-center gap-1.5 text-xs font-bold text-[#7A6B6B] hover:text-[#7B1E3A] transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#D4AF7A]" />
          Refresh
        </button>
      </div>

      {/* Project Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5 text-[#D4AF7A]" />
              </div>
              <h1 className="text-xl font-extrabold text-[#2B1B1B] truncate max-w-sm" title={project.name}>
                {project.name}
              </h1>
            </div>

            {/* Metadata pills */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#7A6B6B] bg-[#FFF8F0] border border-[#F2E8DC] px-3 py-1 rounded-full uppercase tracking-wider">
                <Clock className="h-3 w-3 text-[#D4AF7A]" />
                {new Date(project.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#7A6B6B] bg-[#FFF8F0] border border-[#F2E8DC] px-3 py-1 rounded-full uppercase tracking-wider">
                {project.sourceMedia?.mediaType === "video" ? (
                  <Video className="h-3 w-3 text-[#7B1E3A]" />
                ) : project.inputType === "microphone" ? (
                  <Mic className="h-3 w-3 text-[#7B1E3A]" />
                ) : (
                  <Upload className="h-3 w-3 text-[#7B1E3A]" />
                )}
                {inputTypeInfo.label}
              </span>
              {translation?.detectedLanguage && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                  <Globe className="h-3 w-3 text-emerald-600" />
                  Detected: {translation.detectedLanguage.toUpperCase()}
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#7B1E3A] bg-[#FFF8F0] border border-[#D4AF7A]/40 px-3 py-1 rounded-full uppercase tracking-wider">
                <Globe className="h-3 w-3 text-[#D4AF7A]" />
                Target: {project.targetLanguage}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`shrink-0 self-start inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider ${
            project.status === "completed"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : project.status === "failed"
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-[#FFF8F0] text-[#7B1E3A] border border-[#D4AF7A]/40 animate-pulse"
          }`}>
            {project.status === "completed" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : project.status === "failed" ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            {project.status}
          </span>
        </div>
      </motion.div>

      {/* Processing indicator */}
      {project.status === "processing" && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8F0] border border-[#D4AF7A]/40 px-4 py-3.5">
          <Loader2 className="h-5 w-5 text-[#7B1E3A] animate-spin shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#7B1E3A]">Transcription & Translation in Progress</p>
            <p className="text-[11px] font-semibold text-[#7A6B6B]">This page will auto-refresh. Usually takes 20–60 seconds.</p>
          </div>
        </div>
      )}

      {/* Pipeline Output Sections */}
      {isTranscriptReady && translation && (
        <div className="space-y-6">
          {/* ── Section 1: Transcripts ─────────────────────────────────────────── */}
          <div className="bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F2E8DC] flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
                <Globe className="h-4 w-4 text-[#D4AF7A]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#2B1B1B]">Transcripts</h2>
                <p className="text-[10px] font-semibold text-[#7A6B6B]">Faster-Whisper + Meta NLLB-200</p>
              </div>
            </div>
            <div className="p-6">
              <TranscriptViewer
                projectId={projectId}
                originalText={translation.transcriptText}
                translatedText={translation.translatedText}
                detectedLanguage={translation.detectedLanguage}
                targetLanguage={project.targetLanguage}
                segments={translation.segments}
                translatedSegments={translation.translatedSegments}
              />
            </div>
          </div>

          {/* ── Section 2: Original Audio / Video ──────────────────────────────── */}
          {project.sourceMedia?.cloudinaryUrl && (
            <div className="bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F2E8DC]">
                <h2 className="text-sm font-bold text-[#2B1B1B]">Original Media</h2>
                <p className="text-[10px] font-semibold text-[#7A6B6B]">Your uploaded {project.sourceMedia.mediaType} file</p>
              </div>
              <div className="p-6">
                {project.sourceMedia.mediaType === "video" ? (
                  <video
                    src={project.sourceMedia.cloudinaryUrl}
                    controls
                    className="w-full rounded-2xl border border-[#F2E8DC] max-h-64 bg-black"
                  />
                ) : (
                  <AudioPlayer
                    src={project.sourceMedia.cloudinaryUrl}
                    label="Original Audio"
                    filename={`original_${project.name}`}
                    showDownload={false}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Section 3: Translated Audio (TTS) ─────────────────────────────── */}
          <div className="bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F2E8DC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
                  <Volume2 className="h-4 w-4 text-[#7B1E3A]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#2B1B1B]">Translated Audio</h2>
                  <p className="text-[10px] font-semibold text-[#7A6B6B]">Piper Neural TTS — {project.targetLanguage}</p>
                </div>
              </div>

              {/* TTS Status Badge */}
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                translation.ttsStatus === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                translation.ttsStatus === "failed"    ? "bg-rose-50 text-rose-700 border border-rose-200" :
                translation.ttsStatus === "skipped"   ? "bg-[#FFF8F0] text-[#7A6B6B]" :
                "bg-[#FFF8F0] text-[#7B1E3A] border border-[#D4AF7A]/40"
              }`}>
                {translation.ttsStatus}
              </span>
            </div>
            <div className="p-6">
              {isTTSReady ? (
                <AudioPlayer
                  src={translation.ttsAudioUrl}
                  label={`${project.targetLanguage} Speech`}
                  filename={`translated_${project.targetLanguage.toLowerCase()}`}
                  showDownload={true}
                />
              ) : isTTSProcessing ? (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8F0] border border-[#D4AF7A]/40 p-4">
                  <Loader2 className="h-5 w-5 text-[#7B1E3A] animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[#7B1E3A]">Generating speech...</p>
                    <p className="text-xs font-semibold text-[#7A6B6B]">Neural TTS is synthesizing your translated audio.</p>
                  </div>
                </div>
              ) : translation.ttsStatus === "failed" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-rose-600 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    TTS generation failed.
                  </div>
                  <button
                    onClick={triggerTTS}
                    disabled={triggeringTTS}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-4 py-2 text-xs font-bold text-white hover:opacity-95 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {triggeringTTS ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 text-[#D4AF7A]" />}
                    Retry TTS
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#7A6B6B] font-semibold">TTS audio will be generated automatically after transcription completes.</p>
                  {translation.translatedText && (
                    <button
                      onClick={triggerTTS}
                      disabled={triggeringTTS}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-5 py-2.5 text-xs font-bold text-white hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer border border-[#D4AF7A]/30"
                    >
                      {triggeringTTS ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5 text-[#D4AF7A]" />}
                      Generate Translated Audio
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Section 4: Merged Video (Only for Video-to-Video Translation) ─ */}
          {isVideoProject && (
            <div className="bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F2E8DC] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
                    <Video className="h-4 w-4 text-[#7B1E3A]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#2B1B1B]">Translated Video</h2>
                    <p className="text-[10px] font-semibold text-[#7A6B6B]">Original video + {project.targetLanguage} audio track</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  translation.videoMergeStatus === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  translation.videoMergeStatus === "failed"    ? "bg-rose-50 text-rose-700 border border-rose-200" :
                  translation.videoMergeStatus === "skipped"   ? "bg-[#FFF8F0] text-[#7A6B6B]" :
                  "bg-[#FFF8F0] text-[#7B1E3A] border border-[#D4AF7A]/40"
                }`}>
                  {translation.videoMergeStatus}
                </span>
              </div>
              <div className="p-6">
                {isVideoReady ? (
                  <TranslatedVideoDubPlayer
                    videoSrc={videoPlaybackUrl}
                    audioSrc={translation.ttsAudioUrl}
                    targetLanguage={project.targetLanguage}
                    projectName={project.name}
                  />
                ) : translation.videoMergeStatus === "processing" ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8F0] border border-[#D4AF7A]/40 p-4">
                    <Loader2 className="h-5 w-5 text-[#7B1E3A] animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#7B1E3A]">Merging video...</p>
                      <p className="text-xs font-semibold text-[#7A6B6B]">FFmpeg is combining your video with the translated audio track.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#7A6B6B]">
                      {isTTSReady
                        ? "TTS audio is ready. Click below to merge it with your original video."
                        : "Video merge will be available after translated audio is generated."}
                    </p>
                    {isTTSReady && (
                      <button
                        onClick={triggerVideoMerge}
                        disabled={triggeringMerge}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-5 py-2.5 text-xs font-bold text-white hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer border border-[#D4AF7A]/30"
                      >
                        {triggeringMerge ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5 text-[#D4AF7A]" />}
                        Generate Translated Video
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Section 5: Download Center ─────────────────────────────────────── */}
          <div className="bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft p-6">
            <h2 className="text-sm font-extrabold text-[#2B1B1B] mb-4">Download Center</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a
                href={`/api/download/txt/${projectId}`}
                download
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#F2E8DC] bg-[#FFF8F0] hover:bg-[#F8EFE6] px-3 py-4 text-xs font-bold text-[#2B1B1B] transition-colors text-center cursor-pointer"
              >
                <Download className="h-5 w-5 text-[#D4AF7A]" />
                Transcript<br />.txt
              </a>
              {translation.translatedSegments?.length > 0 && (
                <a
                  href={`/api/download/srt/${projectId}`}
                  download
                  className="flex flex-col items-center gap-2 rounded-2xl border border-[#F2E8DC] bg-[#FFF8F0] hover:bg-[#F8EFE6] px-3 py-4 text-xs font-bold text-[#7B1E3A] transition-colors text-center cursor-pointer"
                >
                  <Download className="h-5 w-5 text-[#D4AF7A]" />
                  Subtitles<br />.srt
                </a>
              )}
              {isTTSReady && (
                <a
                  href={translation.ttsAudioUrl}
                  download={`translated_${project.targetLanguage.toLowerCase()}.mp3`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2 rounded-2xl border border-[#F2E8DC] bg-[#FFF8F0] hover:bg-[#F8EFE6] px-3 py-4 text-xs font-bold text-[#7B1E3A] transition-colors text-center cursor-pointer"
                >
                  <Download className="h-5 w-5 text-[#D4AF7A]" />
                  Audio<br />.mp3
                </a>
              )}
              {isVideoReady && (
                <a
                  href={translation.outputVideoUrl}
                  download={`translated_video.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2 rounded-2xl border border-[#F2E8DC] bg-[#FFF8F0] hover:bg-[#F8EFE6] px-3 py-4 text-xs font-bold text-[#7B1E3A] transition-colors text-center cursor-pointer"
                >
                  <Download className="h-5 w-5 text-[#D4AF7A]" />
                  Video<br />.mp4
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No transcript yet */}
      {!isTranscriptReady && project.status !== "processing" && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft">
          <AlertCircle className="h-10 w-10 text-[#D4AF7A]" />
          <p className="text-sm font-bold text-[#2B1B1B]">No transcript data available.</p>
          <p className="text-xs text-[#7A6B6B] font-semibold">Transcription may have failed. Try re-uploading the file.</p>
        </div>
      )}
    </div>
  );
}
