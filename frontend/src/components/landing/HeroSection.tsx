"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Mic,
  FileAudio,
  Video,
  Check,
  Zap,
  FileText,
  Subtitles,
  Volume2,
  Clapperboard,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * HeroSection Component - Bright Luxury Theme with 3-Stage AI Workflow Card
 */
export default function HeroSection() {
  // Input Selection State (0: Mic, 1: Audio, 2: Video)
  const [selectedInput, setSelectedInput] = useState<number>(2);

  // Active AI Processing Step (1 to 5)
  const [currentStep, setCurrentStep] = useState(3);
  const [progress, setProgress] = useState(80);

  // Auto-cycle through inputs and processing steps to demonstrate workflow dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 5) {
          // Cycle input mode when processing completes
          setSelectedInput((prevInput) => (prevInput + 1) % 3);
          return 1;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Update progress bar based on step
  useEffect(() => {
    const progressMap: Record<number, number> = {
      1: 20,
      2: 40,
      3: 65,
      4: 85,
      5: 100,
    };
    setProgress(progressMap[currentStep] || 80);
  }, [currentStep]);

  const inputOptions = [
    {
      id: 0,
      icon: Mic,
      label: "Record Voice",
      sub: "Live Microphone",
      badge: "Mic",
    },
    {
      id: 1,
      icon: FileAudio,
      label: "Upload Audio",
      sub: "MP3, WAV, M4A",
      badge: "Audio",
    },
    {
      id: 2,
      icon: Video,
      label: "Upload Video",
      sub: "MP4, MOV, AVI",
      badge: "Video",
    },
  ];

  const processingSteps = [
    { step: 1, title: "Speech to Text", engine: "Faster-Whisper ASR" },
    { step: 2, title: "Language Detection", engine: "Auto 40+ Languages" },
    { step: 3, title: "AI Translation", engine: "Meta NLLB-200" },
    { step: 4, title: "Natural Voice Generation", engine: "Piper Neural TTS" },
    { step: 5, title: "Video Rendering", engine: "FFmpeg Stream Sync" },
  ];

  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-32 bg-[#FFF8F0]">
      {/* Background Decorative Radial Gradient & Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-[#D4AF7A]/15 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-[#7B1E3A]/5 blur-[110px] pointer-events-none z-0" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* ── Left Column: Headline Copy & CTAs ───────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-[#D4AF7A]/40 px-4 py-1.5 text-xs font-bold text-[#7B1E3A] shadow-soft"
            >
              <Sparkles className="h-4 w-4 text-[#D4AF7A]" />
              <span>VoxBridge AI 2.0 • Workflow Engine</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-[#2B1B1B]"
            >
              Transform Speech & Video <br />
              <span className="gradient-text">In 3 Seamless Stages.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-relaxed text-[#7A6B6B] font-semibold"
            >
              From live voice recording to localized video dubbing — experience high-speed offline AI translation with preserved natural voice synthesis.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <Link
                href="/dashboard/upload"
                className="group flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-8 py-4 text-base font-extrabold text-white shadow-md shadow-[#7B1E3A]/20 hover:shadow-lg hover:shadow-[#7B1E3A]/30 transition-all duration-200 border border-[#D4AF7A]/30 active:scale-95 cursor-pointer"
              >
                <Sparkles className="h-4.5 w-4.5 text-[#D4AF7A]" />
                Start Translating Free
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[rgba(123,30,58,0.18)] bg-white px-8 py-4 text-base font-extrabold text-[#2B1B1B] hover:bg-[#F8EFE6] transition-all duration-200 shadow-soft active:scale-95 cursor-pointer"
              >
                See How It Works
              </a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-xs font-bold text-[#7A6B6B]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>100% Offline AI Pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF7A]" />
                <span>40+ Languages Supported</span>
              </div>
            </motion.div>
          </div>

          {/* ── Right Column: Premium Three-Stage AI Workflow Card ──────────────────── */}
          <div className="lg:col-span-7 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full bg-white rounded-[24px] p-6 sm:p-7 shadow-xl shadow-[#7B1E3A]/5 border border-[rgba(123,30,58,0.12)] space-y-6 relative overflow-hidden"
            >
              {/* Card Top Accent Highlight */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#D4AF7A]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Workflow Header */}
              <div className="flex items-center justify-between border-b border-[rgba(123,30,58,0.12)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
                    <Zap className="h-5 w-5 text-[#D4AF7A]" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#2B1B1B] tracking-tight">
                      3-Stage AI Transformation Engine
                    </h2>
                    <p className="text-xs font-semibold text-[#7A6B6B]">
                      Input → Neural Processing → Multi-Format Delivery
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 bg-[#FFF8F0] border border-[#D4AF7A]/40 px-3 py-1 rounded-full text-[10px] font-bold text-[#7B1E3A]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>LIVE WORKFLOW</span>
                </div>
              </div>

              {/* ──────────────── STAGE 1: INPUT ──────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#7B1E3A] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-md bg-[#FFF8F0] border border-[#D4AF7A]/50 text-[#7B1E3A] flex items-center justify-center text-[10px]">
                      1
                    </span>
                    Stage 1 – Input
                  </span>
                  <span className="text-[11px] font-semibold text-[#7A6B6B]">Choose Source Format</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {inputOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedInput === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedInput(opt.id)}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative ${
                          isSelected
                            ? "bg-[#FFF8F0] border-[#7B1E3A] shadow-sm ring-1 ring-[#7B1E3A]/20"
                            : "bg-white border-[#F2E8DC] hover:bg-[#FFF8F0]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon
                            className={`h-5 w-5 ${
                              isSelected ? "text-[#7B1E3A]" : "text-[#D4AF7A]"
                            }`}
                          />
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-[#7B1E3A] animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs font-extrabold text-[#2B1B1B] truncate">
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-[#7A6B6B] font-semibold truncate">
                          {opt.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── FLOWING CONNECTOR LINE 1 → 2 ── */}
              <div className="relative flex items-center justify-center py-1">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D4AF7A] to-transparent" />
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bg-white border border-[#D4AF7A]/60 px-2 py-0.5 rounded-full text-[#7B1E3A] shadow-xs flex items-center gap-1 text-[10px] font-bold"
                >
                  <ArrowDown className="h-3 w-3 text-[#D4AF7A]" />
                  <span>Processing Flow</span>
                </motion.div>
              </div>

              {/* ──────────────── STAGE 2: AI PROCESSING ──────────────── */}
              <div className="space-y-3 bg-[#FFF8F0]/60 p-4 rounded-2xl border border-[rgba(123,30,58,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#7B1E3A] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-md bg-[#7B1E3A] text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Stage 2 – AI Processing
                  </span>
                  <span className="text-[11px] font-bold text-[#7B1E3A]">
                    Progress {progress}%
                  </span>
                </div>

                {/* Smooth Animated Steps */}
                <div className="space-y-2">
                  {processingSteps.map((s) => {
                    const isCompleted = currentStep > s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div
                        key={s.step}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-300 ${
                          isCompleted || isCurrent
                            ? "bg-white border border-[#D4AF7A]/40 shadow-xs"
                            : "bg-white/50 border border-transparent opacity-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isCompleted
                                ? "bg-[#D4AF7A] text-white"
                                : isCurrent
                                ? "bg-[#7B1E3A] text-white animate-pulse"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {isCompleted ? <Check className="h-3 w-3" /> : s.step}
                          </div>
                          <span className="font-bold text-[#2B1B1B] truncate">{s.title}</span>
                        </div>

                        <span className="text-[10px] font-extrabold text-[#7B1E3A] bg-[#FFF8F0] px-2 py-0.5 rounded-md border border-[#F2E8DC] shrink-0">
                          {s.engine}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-[#F2E8DC] p-0.5">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#7B1E3A] via-[#A23B5A] to-[#D4AF7A] rounded-full"
                  />
                </div>
              </div>

              {/* ── FLOWING CONNECTOR LINE 2 → 3 ── */}
              <div className="relative flex items-center justify-center py-1">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D4AF7A] to-transparent" />
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  className="absolute bg-white border border-[#D4AF7A]/60 px-2 py-0.5 rounded-full text-[#7B1E3A] shadow-xs flex items-center gap-1 text-[10px] font-bold"
                >
                  <ArrowDown className="h-3 w-3 text-[#D4AF7A]" />
                  <span>Output Generation</span>
                </motion.div>
              </div>

              {/* ──────────────── STAGE 3: OUTPUT ──────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#7B1E3A] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-md bg-[#FFF8F0] border border-[#D4AF7A]/50 text-[#7B1E3A] flex items-center justify-center text-[10px]">
                      3
                    </span>
                    Stage 3 – Output
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ready for Export
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-[rgba(123,30,58,0.12)] space-y-1 hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center justify-between">
                      <Volume2 className="h-4 w-4 text-[#7B1E3A]" />
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        MP3
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#2B1B1B]">Translated Audio</p>
                    <p className="text-[10px] text-[#7A6B6B] font-semibold">Piper Voice</p>
                  </div>

                  <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-[rgba(123,30,58,0.12)] space-y-1 hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center justify-between">
                      <Clapperboard className="h-4 w-4 text-[#7B1E3A]" />
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        MP4
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#2B1B1B]">Translated Video</p>
                    <p className="text-[10px] text-[#7A6B6B] font-semibold">Synced Audio</p>
                  </div>

                  <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-[rgba(123,30,58,0.12)] space-y-1 hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center justify-between">
                      <FileText className="h-4 w-4 text-[#D4AF7A]" />
                      <span className="text-[9px] font-bold text-[#7B1E3A] bg-white px-1.5 py-0.5 rounded border border-[#F2E8DC]">
                        TXT
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#2B1B1B]">Transcript</p>
                    <p className="text-[10px] text-[#7A6B6B] font-semibold">Dual Language</p>
                  </div>

                  <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-[rgba(123,30,58,0.12)] space-y-1 hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center justify-between">
                      <Subtitles className="h-4 w-4 text-[#D4AF7A]" />
                      <span className="text-[9px] font-bold text-[#7B1E3A] bg-white px-1.5 py-0.5 rounded border border-[#F2E8DC]">
                        SRT
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#2B1B1B]">Subtitles</p>
                    <p className="text-[10px] text-[#7A6B6B] font-semibold">Timestamps</p>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
