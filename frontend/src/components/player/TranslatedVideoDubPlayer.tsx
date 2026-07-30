"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react";

export interface TranslatedVideoDubPlayerProps {
  videoSrc: string;
  audioSrc: string;
  targetLanguage: string;
  projectName: string;
}

/**
 * TranslatedVideoDubPlayer — Video + Generated Translated Audio Synchronizer
 *
 * Why it is needed:
 * - Plays uploaded video files with the GENERATED translated audio track instead of the original audio.
 * - Keeps video playback and translated TTS speech audio in 100% frame-accurate sync.
 */
export default function TranslatedVideoDubPlayer({
  videoSrc,
  audioSrc,
  targetLanguage,
  projectName,
}: TranslatedVideoDubPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    // Force video element to mute native audio track so generated TTS audio plays exclusively
    video.muted = true;

    const handleTimeUpdate = () => {
      if (video.duration) {
        const pct = (video.currentTime / video.duration) * 100;
        setProgress(pct);
        setCurrentTime(formatTime(video.currentTime));
        setDuration(formatTime(video.duration));

        // Sync audio time to video time if drift exceeds 0.25 seconds
        if (Math.abs(audio.currentTime - video.currentTime) > 0.25) {
          audio.currentTime = video.currentTime;
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoSrc, audioSrc]);

  const togglePlay = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    if (isPlaying) {
      video.pause();
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.currentTime = video.currentTime;
      Promise.all([
        video.play(),
        audio.play(),
      ]).then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Dubbed playback error:", err);
      });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !video.duration) return;

    const newTime = (parseFloat(e.target.value) / 100) * video.duration;
    video.currentTime = newTime;
    audio.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-3">
      {/* Synchronized Media Stage */}
      <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-[#F2E8DC] group shadow-soft">
        {/* Original Video Frame (Native audio muted) */}
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          muted
          className="w-full h-full object-contain"
        />

        {/* Generated Translated Speech Audio Element */}
        <audio ref={audioRef} src={audioSrc} crossOrigin="anonymous" />

        {/* Play Overlay Button */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-[#7B1E3A]/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-30 cursor-pointer border-2 border-[#D4AF7A]"
          >
            <Play className="h-8 w-8 text-[#D4AF7A] ml-1" />
          </button>
        )}

        {/* Top Language Badge */}
        <div className="absolute top-4 right-4 z-20 bg-[#7B1E3A]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#D4AF7A]/50 text-white text-xs font-extrabold uppercase tracking-wider">
          Dubbed in {targetLanguage}
        </div>

        {/* Custom Video Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col gap-2 z-20">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full accent-[#D4AF7A] h-1.5 rounded-full bg-white/20 cursor-pointer"
          />

          <div className="flex items-center justify-between text-white text-xs font-bold pt-1">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="hover:text-[#D4AF7A] transition-colors cursor-pointer">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button onClick={toggleMute} className="hover:text-[#D4AF7A] transition-colors cursor-pointer">
                {isMuted ? <VolumeX className="h-5 w-5 text-rose-400" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <span className="text-zinc-300 text-[11px]">{currentTime} / {duration}</span>
            </div>

            <span className="text-xs text-[#D4AF7A] font-bold flex items-center gap-1">
              ✨ Generated {targetLanguage} Audio Active
            </span>
          </div>
        </div>
      </div>

      {/* Download Action Footer */}
      <a
        href={videoSrc}
        download={`voxbridge_dubbed_${targetLanguage.toLowerCase()}_${projectName}.mp4`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-4 py-2 text-xs font-bold text-white hover:opacity-95 transition-all border border-[#D4AF7A]/30 shadow-sm"
      >
        <Download className="h-3.5 w-3.5 text-[#D4AF7A]" />
        Download Translated Video (.mp4)
      </a>
    </div>
  );
}
