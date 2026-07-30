"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, Volume2 } from "lucide-react";

export interface AudioPlayerProps {
  src: string;
  label?: string;
  filename?: string;
  accentColor?: string;
  showDownload?: boolean;
}

/**
 * AudioPlayer — Custom HTML5 Audio Player Component (Bright Luxury Theme)
 */
export default function AudioPlayer({
  src,
  label = "Audio",
  filename = "voxbridge_audio",
  showDownload = true,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [progress, setProgress]     = useState(0);   // 0–100
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const [duration, setDuration]     = useState(0);   // seconds
  const [isLoading, setIsLoading]   = useState(true);
  const [hasError, setHasError]     = useState(false);

  // Attach audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onEnded = () => setIsPlaying(false);
    const onError = () => { setHasError(true); setIsLoading(false); };
    const onCanPlay = () => setIsLoading(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    audio.currentTime = ratio * duration;
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (hasError) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-bold">
        <Volume2 className="h-4 w-4" />
        Unable to load audio. The file may still be processing.
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#F2E8DC] bg-white shadow-soft p-5 space-y-4">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
            <Volume2 className="h-4 w-4 text-[#D4AF7A]" />
          </div>
          <span className="text-xs font-bold text-[#2B1B1B] uppercase tracking-wider">{label}</span>
        </div>

        {showDownload && (
          <a
            href={src}
            download={`${filename}.mp3`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-[#7B1E3A] bg-[#FFF8F0] hover:bg-[#F8EFE6] border border-[#F2E8DC] px-3 py-1.5 rounded-xl transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#D4AF7A]" />
            Download MP3
          </a>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="h-10 w-10 rounded-full bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] flex items-center justify-center text-white shadow-md shadow-[#7B1E3A]/20 hover:opacity-95 transition-all disabled:opacity-50 border border-[#D4AF7A]/30 shrink-0 cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-[#D4AF7A]" />
          ) : (
            <Play className="h-4 w-4 text-[#D4AF7A] ml-0.5" />
          )}
        </button>

        {/* Seek Bar */}
        <div className="flex-1 space-y-1.5">
          <div
            className="h-2.5 w-full bg-[#FFF8F0] border border-[#F2E8DC] rounded-full cursor-pointer overflow-hidden group"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gradient-to-r from-[#7B1E3A] to-[#D4AF7A] rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono font-bold text-[#7A6B6B]">
            <span>{formatTime(currentTime)}</span>
            <span>{isLoading ? "..." : formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Hidden actual audio element */}
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}
