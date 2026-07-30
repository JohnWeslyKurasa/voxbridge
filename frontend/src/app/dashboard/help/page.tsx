"use client";

import { useState } from "react";
import {
  HelpCircle,
  BookOpen,
  ChevronDown,
  Mic,
  Video,
  Type,
  FileText,
} from "lucide-react";

const FAQS = [
  {
    q: "How does VoxBridge AI process audio and video files?",
    a: "VoxBridge AI uses a 4-step pipeline: (1) Audio is extracted using FFmpeg, (2) Speech is transcribed using Faster-Whisper, (3) Text is translated using Meta NLLB-200, (4) Speech is synthesized using Piper TTS, and optionally merged back into video via FFmpeg.",
  },
  {
    q: "Are translation services completely free?",
    a: "Yes! VoxBridge AI relies 100% on open-source, offline AI models (Faster-Whisper, Meta NLLB-200, Piper TTS, FFmpeg). No paid API keys or subscriptions are required.",
  },
  {
    q: "What Indian languages are supported?",
    a: "We support English, Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, and Urdu.",
  },
  {
    q: "How does Text to Voice work?",
    a: "Click on the 'Text to Voice' tab in the Upload workspace, type or paste your text, pick your source and target languages, and click submit. The AI translates your text in ~0.4s and generates downloadable MP3 speech.",
  },
];

/**
 * HelpPage — /dashboard/help (Bright Luxury Theme)
 */
export const dynamic = "force-dynamic";

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B1B1B] tracking-tight flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
            <HelpCircle className="h-5 w-5 text-[#D4AF7A]" />
          </div>
          Help & Documentation
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6B6B] font-semibold mt-1">
          Learn how to use VoxBridge AI, inspect supported languages, and troubleshoot your pipeline.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-[20px] border border-[#F2E8DC] shadow-soft space-y-1.5">
          <div className="flex items-center gap-2 text-[#7B1E3A] font-extrabold text-xs">
            <Type className="h-4 w-4 text-[#D4AF7A]" />
            <span>Text to Voice</span>
          </div>
          <p className="text-[11px] text-[#7A6B6B] font-semibold">Direct text input translation and speech generation in 0.4s.</p>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#F2E8DC] shadow-soft space-y-1.5">
          <div className="flex items-center gap-2 text-[#7B1E3A] font-extrabold text-xs">
            <Mic className="h-4 w-4 text-[#D4AF7A]" />
            <span>Mic Record</span>
          </div>
          <p className="text-[11px] text-[#7A6B6B] font-semibold">Live browser microphone recording with real-time waveform.</p>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#F2E8DC] shadow-soft space-y-1.5">
          <div className="flex items-center gap-2 text-[#7B1E3A] font-extrabold text-xs">
            <FileText className="h-4 w-4 text-[#D4AF7A]" />
            <span>Subtitles</span>
          </div>
          <p className="text-[11px] text-[#7A6B6B] font-semibold">Download formatted .SRT & .TXT subtitle files with timestamps.</p>
        </div>

        <div className="bg-white p-4 rounded-[20px] border border-[#F2E8DC] shadow-soft space-y-1.5">
          <div className="flex items-center gap-2 text-[#7B1E3A] font-extrabold text-xs">
            <Video className="h-4 w-4 text-[#D4AF7A]" />
            <span>Video Merge</span>
          </div>
          <p className="text-[11px] text-[#7A6B6B] font-semibold">FFmpeg audio stream replacement for video dubbing.</p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-[20px] border border-[#F2E8DC] p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#F2E8DC] pb-3">
          <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-[#7B1E3A]" />
          </div>
          <h2 className="text-sm font-bold text-[#2B1B1B]">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-[#F2E8DC] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-[#2B1B1B] bg-[#FFF8F0]/50 hover:bg-[#FFF8F0] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-[#D4AF7A] transition-transform ${isOpen ? "rotate-180 text-[#7B1E3A]" : ""}`} />
                </button>
                {isOpen && (
                  <div className="p-4 bg-white text-xs text-[#7A6B6B] border-t border-[#F2E8DC] leading-relaxed font-semibold">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
