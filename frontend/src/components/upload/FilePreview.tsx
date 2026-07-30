"use client";

import { FileVideo, FileAudio, X, RefreshCw, CheckCircle2, AlertTriangle, Play, Pause } from "lucide-react";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

export interface FilePreviewProps {
  file: File;
  previewUrl: string | null;
  progress: number;
  status: "idle" | "validating" | "uploading" | "success" | "error";
  error: string | null;
  videoMetadata: { duration: number; width?: number; height?: number } | null;
  onCancel: () => void;
  onRetry: () => void;
  onReset: () => void;
  onProceed?: () => void;
}

/**
 * Reusable File Preview & Progress Container Component
 * 
 * Why it is needed:
 * - Gives clear, visual feedback of file dimensions, formats, and upload status.
 * - Supports responsive players for both audio waveforms and video screens.
 * 
 * How it works:
 * - Formats durations and file sizes dynamically.
 * - Inspects MIME types to mount either a video screen or an audio waveform animation.
 * - Connects progress listeners to CSS-animated bar widths.
 */
export default function FilePreview({
  file,
  previewUrl,
  progress,
  status,
  error,
  videoMetadata,
  onCancel,
  onRetry,
  onReset,
  onProceed,
}: FilePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Helper: Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper: Format duration (seconds to MM:SS)
  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds === 0) return "Calculating...";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".webm") || file.name.endsWith(".mov") || file.name.endsWith(".mkv") || file.name.endsWith(".avi");
  const durationText = videoMetadata?.duration ? formatDuration(videoMetadata.duration) : "Calculating...";

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full bg-white border border-slate-200/60 shadow-xl rounded-2xl p-6 space-y-6 relative overflow-hidden"
    >
      {/* Decorative gradient glow on success */}
      {status === "success" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] pointer-events-none rounded-full" />
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            isVideo ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
          }`}>
            {isVideo ? <FileVideo className="h-6 w-6" /> : <FileAudio className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate" title={file.name}>
              {file.name}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {formatSize(file.size)} • {isVideo ? "Video File" : "Audio File"}
            </p>
          </div>
        </div>

        {/* Clear/Reset button when not uploading */}
        {status !== "uploading" && status !== "success" && (
          <button
            onClick={onReset}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Local Media Player Previews */}
      {previewUrl && (
        <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-900 shadow-inner max-h-[260px] flex items-center justify-center relative group">
          {isVideo ? (
            <video
              src={previewUrl}
              controls
              className="w-full max-h-[260px] object-contain"
            />
          ) : (
            <div className="w-full py-10 px-6 flex flex-col items-center justify-center space-y-4">
              <audio
                ref={audioRef}
                src={previewUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              
              {/* Custom Web Audio Waveform Placeholder */}
              <div className="flex items-end justify-center gap-1.5 h-12 w-full max-w-[200px]">
                {[...Array(12)].map((_, index) => (
                  <motion.div
                    key={index}
                    animate={isPlaying ? { height: [8, Math.random() * 40 + 8, 8] } : { height: 12 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      delay: index * 0.08,
                      ease: "easeInOut",
                    }}
                    className="w-2 rounded-full bg-purple-500/80"
                  />
                ))}
              </div>

              {/* Playback Controls */}
              <button
                onClick={toggleAudio}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="h-4.5 w-4.5 fill-current ml-0.5" />}
              </button>
            </div>
          )}

          {/* Media Info Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 text-[10px] font-bold text-white tracking-wider uppercase">
            Duration: {durationText} {videoMetadata?.width && `• ${videoMetadata.width}x${videoMetadata.height}`}
          </div>
        </div>
      )}

      {/* Upload Progress states */}
      <div className="space-y-3.5">
        {/* Uploading Progress */}
        {status === "uploading" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-600 animate-pulse">Uploading to Cloudinary...</span>
              <span className="font-bold text-slate-600">{progress}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
                className="h-full gradient-bg rounded-full shadow-inner"
              />
            </div>

            {/* Cancel trigger */}
            <div className="flex justify-end pt-1">
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
                Cancel Upload
              </button>
            </div>
          </div>
        )}

        {/* Success state */}
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/50 p-4 text-emerald-800 text-xs font-bold shadow-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>Media uploaded successfully! Target workspace configured.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onReset}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Upload Another
              </button>
              {onProceed && (
                <button
                  onClick={onProceed}
                  className="flex-1 rounded-xl gradient-bg py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:opacity-90 transition-all"
                >
                  Configure Translation
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200/50 p-4 text-rose-800 text-xs font-medium shadow-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Upload Failed</p>
                <p className="text-[11px] text-rose-600/90 leading-relaxed">{error}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onReset}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel / Reset
              </button>
              <button
                onClick={onRetry}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl gradient-bg py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:opacity-90 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Upload
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
