"use client";

import { useState, useCallback, useEffect } from "react";
import { useUpload } from "@/hooks/useUpload";
import DragDropZone from "@/components/upload/DragDropZone";
import FilePreview from "@/components/upload/FilePreview";
import InputModeSelector, { InputMode } from "@/components/upload/InputModeSelector";
import MicrophoneRecorder from "@/components/upload/MicrophoneRecorder";
import TextInputWorkspace from "@/components/upload/TextInputWorkspace";
import LanguageSearchSelector from "@/components/language/LanguageSearchSelector";
import { ArrowLeft, Info, Sparkles } from "lucide-react";
import Link from "next/link";

/** All supported languages with native scripts for the searchable selector */
const LANGUAGES = [
  { name: "English",   nativeScript: "English",    flag: "🇬🇧" },
  { name: "Hindi",     nativeScript: "हिन्दी",      flag: "🇮🇳" },
  { name: "Telugu",    nativeScript: "తెలుగు",      flag: "🇮🇳" },
  { name: "Tamil",     nativeScript: "தமிழ்",       flag: "🇮🇳" },
  { name: "Kannada",   nativeScript: "ಕನ್ನಡ",      flag: "🇮🇳" },
  { name: "Malayalam", nativeScript: "മലയാളം",     flag: "🇮🇳" },
  { name: "Bengali",   nativeScript: "বাংলা",        flag: "🇮🇳" },
  { name: "Marathi",   nativeScript: "मराठी",        flag: "🇮🇳" },
  { name: "Gujarati",  nativeScript: "ગુજરાતી",     flag: "🇮🇳" },
  { name: "Punjabi",   nativeScript: "ਪੰਜਾਬੀ",      flag: "🇮🇳" },
  { name: "Odia",      nativeScript: "ଓଡ଼ିଆ",       flag: "🇮🇳" },
  { name: "Assamese",  nativeScript: "অসমীয়া",     flag: "🇮🇳" },
  { name: "Urdu",      nativeScript: "اردو",         flag: "🇵🇰" },
];

/**
 * Upload Page — /dashboard/upload (Bright Luxury Theme)
 */
export default function UploadPage() {
  const [inputMode, setInputMode]       = useState<InputMode>("upload_audio");
  const [targetLanguage, setTargetLanguage] = useState("Hindi");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get("mode") as InputMode | null;
      if (modeParam && ["upload_audio", "upload_video", "microphone", "text"].includes(modeParam)) {
        setInputMode(modeParam);
      }
    }
  }, []);

  const allowedExtensions =
    inputMode === "upload_video"
      ? ["mp4", "mov", "avi", "mkv", "webm"]
      : ["mp3", "wav", "aac", "flac", "m4a", "ogg", "mp4", "mov", "avi", "mkv", "webm"];

  const {
    file,
    progress,
    status,
    error,
    previewUrl,
    videoMetadata,
    startUpload,
    cancel,
    reset,
  } = useUpload({
    userId: "mock-user-johnk",
    allowedExtensions,
    onSuccess: (projectId) => {
      console.log("✅ Upload complete. Project ID:", projectId);
    },
  });

  const handleRecordingReady = useCallback(
    (blob: Blob, filename: string) => {
      const file = new File([blob], filename, { type: blob.type });
      startUpload(file, targetLanguage, "microphone");
    },
    [startUpload, targetLanguage]
  );

  const handleModeChange = (mode: InputMode) => {
    reset();
    setInputMode(mode);
  };

  const handleProceed = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-bold text-[#7A6B6B] hover:text-[#7B1E3A] transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4 text-[#D4AF7A]" />
          Back to Dashboard
        </Link>
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#7B1E3A] bg-[#FFF8F0] border border-[#D4AF7A]/40 px-3.5 py-1 rounded-full">
          Step 1: Choose Input
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left/Main Input Workspace ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[#2B1B1B] tracking-tight">
              New Translation Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6B6B] font-semibold">
              Record, upload audio, or upload video. We&apos;ll transcribe, translate, and generate speech automatically.
            </p>
          </div>

          {/* Input Mode Selector */}
          {!file && status === "idle" && (
            <InputModeSelector value={inputMode} onChange={handleModeChange} />
          )}

          {/* Text to Voice Mode */}
          {inputMode === "text" && !file && status === "idle" && (
            <TextInputWorkspace
              languages={LANGUAGES}
              targetLanguage={targetLanguage}
              onSuccess={(projectId) => {
                window.location.href = `/dashboard/project/${projectId}`;
              }}
            />
          )}

          {/* Microphone Mode */}
          {inputMode === "microphone" && !file && status === "idle" && (
            <MicrophoneRecorder onRecordingReady={handleRecordingReady} />
          )}

          {/* Audio / Video Upload Mode */}
          {inputMode !== "microphone" && inputMode !== "text" && !file && (
            <DragDropZone
              onFileSelected={(selectedFile) => startUpload(selectedFile, targetLanguage, inputMode)}
              allowedExtensions={allowedExtensions}
            />
          )}

          {/* Active Upload / Preview */}
          {file && (
            <FilePreview
              file={file}
              previewUrl={previewUrl}
              progress={progress}
              status={status}
              error={error}
              videoMetadata={videoMetadata}
              onCancel={cancel}
              onRetry={() => startUpload(file, targetLanguage, inputMode)}
              onReset={() => { reset(); }}
              onProceed={handleProceed}
            />
          )}

          {/* Success redirect hint */}
          {status === "success" && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-700 font-bold">
              ✅ Upload complete! Transcription and translation are running in the background. Head to your dashboard to track progress.
            </div>
          )}
        </div>

        {/* ── Right Configuration Panel ────────────────────────────────────── */}
        <div className="space-y-5 lg:mt-11">
          {/* Language Selection */}
          <div className="glass-card rounded-[20px] p-5 border border-[#F2E8DC] bg-white shadow-soft space-y-5 relative">
            <div className="flex items-center gap-2 border-b border-[#F2E8DC] pb-3">
              <span className="text-base">🌐</span>
              <h2 className="text-xs font-bold text-[#2B1B1B] uppercase tracking-wider">
                Translation Target
              </h2>
            </div>

            {/* Searchable Language Selector */}
            <LanguageSearchSelector
              languages={LANGUAGES}
              value={targetLanguage}
              onChange={setTargetLanguage}
              disabled={status === "uploading"}
              label="Target Language"
            />

            {/* AI Voice Synthesis Note */}
            <div className="rounded-xl bg-[#FFF8F0] border border-[#D4AF7A]/40 p-4 text-xs text-[#7B1E3A] space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="h-4 w-4 text-[#D4AF7A]" />
                <span>Piper Neural Synthesis</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#7A6B6B] font-semibold">
                After translation, we automatically generate a translated audio file using Piper TTS (100% offline, high accuracy).
              </p>
            </div>
          </div>

          {/* Guidelines Card */}
          <div className="glass-card rounded-[20px] p-5 border border-[#F2E8DC] bg-white shadow-soft space-y-3.5 text-xs">
            <div className="flex items-center gap-2 border-b border-[#F2E8DC] pb-3 text-[#2B1B1B] font-bold uppercase tracking-wider">
              <Info className="h-4 w-4 text-[#D4AF7A]" />
              <span>Guidelines</span>
            </div>
            <ul className="space-y-2 text-[#7A6B6B] font-semibold list-disc list-inside">
              <li>Keep background noise minimal for clean transcription.</li>
              <li>Clear speech increases translation accuracy by 98%.</li>
              <li>Max file size: 100MB per upload.</li>
              <li>Supported audio: MP3, WAV, AAC, M4A, OGG, FLAC</li>
              <li>Supported video: MP4, WebM, MOV, AVI, MKV</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
