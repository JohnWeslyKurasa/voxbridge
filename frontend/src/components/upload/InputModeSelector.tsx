"use client";

import { Mic, Upload, Video, Type } from "lucide-react";
import { motion } from "framer-motion";

export type InputMode = "microphone" | "upload_audio" | "upload_video" | "text";

export interface InputModeSelectorProps {
  value: InputMode;
  onChange: (mode: InputMode) => void;
}

const modes = [
  {
    id: "text" as InputMode,
    icon: Type,
    label: "Text to Voice",
    description: "Direct text translation & speech",
  },
  {
    id: "microphone" as InputMode,
    icon: Mic,
    label: "Record Voice",
    description: "Live microphone recording",
  },
  {
    id: "upload_audio" as InputMode,
    icon: Upload,
    label: "Upload Audio",
    description: "MP3, WAV, AAC, M4A, FLAC",
  },
  {
    id: "upload_video" as InputMode,
    icon: Video,
    label: "Upload Video",
    description: "MP4, WebM, MOV, AVI, MKV",
  },
];

/**
 * InputModeSelector — Four-tab Input Method Chooser (Bright Luxury Theme)
 */
export default function InputModeSelector({ value, onChange }: InputModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Input method">
      {modes.map((mode) => {
        const isActive = value === mode.id;
        const Icon = mode.icon;

        return (
          <motion.button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(mode.id)}
            className={`relative flex flex-col items-center gap-2 rounded-[20px] border-2 p-4 text-center transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] text-white border-[#D4AF7A] shadow-md shadow-[#7B1E3A]/20"
                : "border-[#F2E8DC] bg-white text-[#2B1B1B] hover:border-[#D4AF7A]/50 hover:bg-[#FFF8F0]"
            }`}
          >
            {/* Icon */}
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                isActive ? "bg-white/10 text-[#D4AF7A] border border-white/20" : "bg-[#FFF8F0] text-[#7B1E3A] border border-[#F2E8DC]"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Labels */}
            <div className="space-y-0.5">
              <p className={`text-xs font-bold tracking-tight ${isActive ? "text-white" : "text-[#2B1B1B]"}`}>
                {mode.label}
              </p>
              <p className={`text-[10px] font-semibold leading-tight hidden sm:block ${isActive ? "text-white/80" : "text-[#7A6B6B]"}`}>
                {mode.description}
              </p>
            </div>

            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="input-mode-dot"
                className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#D4AF7A] shadow-sm"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
