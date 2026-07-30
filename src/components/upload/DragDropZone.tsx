"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileVideo, FileAudio, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export interface DragDropZoneProps {
  onFileSelected: (file: File) => void;
  allowedExtensions?: string[];
  maxSizeMB?: number;
}

/**
 * Premium Drag & Drop Upload Zone Component - Bright Luxury Theme
 */
export default function DragDropZone({
  onFileSelected,
  allowedExtensions = ["mp4", "mov", "avi", "mkv", "webm", "mp3", "wav", "aac", "flac", "m4a"],
  maxSizeMB = 100,
}: DragDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative w-full rounded-[20px] border-2 border-dashed p-10 text-center transition-all duration-300 ${
        isDragActive
          ? "border-[#7B1E3A] bg-[#FFF8F0] ring-4 ring-[#7B1E3A]/10 shadow-lg"
          : "border-[#F2E8DC] hover:border-[#D4AF7A] bg-white shadow-soft hover:shadow-md"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        id="media-file-upload"
        multiple={false}
        onChange={handleChange}
        accept={allowedExtensions.map((ext) => `.${ext}`).join(",")}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Animated Icon container */}
        <motion.div
          animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors duration-300 ${
            isDragActive ? "bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white border-[#D4AF7A]" : "bg-[#FFF8F0] text-[#7B1E3A] border-[#F2E8DC]"
          }`}
        >
          <UploadCloud className="h-8 w-8 text-[#D4AF7A]" />
        </motion.div>

        <div className="space-y-1.5 max-w-sm">
          <p className="text-base font-bold text-[#2B1B1B]">
            Drag & drop your file here, or{" "}
            <button
              type="button"
              onClick={onButtonClick}
              className="text-[#7B1E3A] hover:underline font-extrabold focus:outline-none cursor-pointer"
            >
              browse
            </button>
          </p>
          <p className="text-xs font-semibold text-[#7A6B6B]">
            Supports high quality video & audio formats up to {maxSizeMB}MB
          </p>
        </div>

        {/* Formats capsules grid */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-md">
          <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#2B1B1B] bg-[#FFF8F0] border border-[#F2E8DC] px-2.5 py-1 rounded-lg">
            <FileVideo className="h-3.5 w-3.5 text-[#D4AF7A]" />
            Video: MP4, WebM, MOV, AVI, MKV
          </span>
          <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#2B1B1B] bg-[#FFF8F0] border border-[#F2E8DC] px-2.5 py-1 rounded-lg">
            <FileAudio className="h-3.5 w-3.5 text-[#7B1E3A]" />
            Audio: MP3, WAV, M4A, FLAC, AAC
          </span>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#7B1E3A] bg-[#FFF8F0] border border-[#D4AF7A]/40 px-3.5 py-1.5 rounded-xl mt-4">
          <AlertCircle className="h-4 w-4 text-[#D4AF7A]" />
          <span>Credits cost is calculated based on media duration (1 credit per minute)</span>
        </div>
      </div>
    </motion.div>
  );
}
