"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptViewerProps {
  projectId: string;
  originalText: string;
  translatedText: string;
  detectedLanguage?: string;
  targetLanguage: string;
  segments?: TranscriptSegment[];
  translatedSegments?: TranscriptSegment[];
}

/**
 * TranscriptViewer — Side-by-side / Tabbed Transcript Display Component (Bright Luxury Theme)
 */
export default function TranscriptViewer({
  projectId,
  originalText,
  translatedText,
  detectedLanguage = "en",
  targetLanguage,
  segments = [],
  translatedSegments = [],
}: TranscriptViewerProps) {
  const [activeTab, setActiveTab] = useState<"original" | "translated">(
    translatedText ? "translated" : "original"
  );

  const isTranslated = activeTab === "translated";
  const displayText = isTranslated ? translatedText : originalText;
  const displaySegments = isTranslated ? translatedSegments : segments;
  const displayLangLabel = isTranslated
    ? targetLanguage
    : `Original (${detectedLanguage.toUpperCase()})`;

  return (
    <div className="space-y-4">
      {/* Tab Selector + Download Buttons */}
      <div className="flex items-center justify-between border-b border-[#F2E8DC] pb-0">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("original")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "original"
                ? "border-[#D4AF7A] text-[#7B1E3A]"
                : "border-transparent text-[#7A6B6B] hover:text-[#2B1B1B]"
            }`}
          >
            Original ({detectedLanguage.toUpperCase()})
          </button>
          <button
            onClick={() => setActiveTab("translated")}
            disabled={!translatedText}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "translated"
                ? "border-[#D4AF7A] text-[#7B1E3A]"
                : "border-transparent text-[#7A6B6B] hover:text-[#2B1B1B]"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {targetLanguage}
          </button>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2 pb-1.5">
          <a
            href={`/api/download/txt/${projectId}`}
            download
            className="flex items-center gap-1.5 text-xs font-bold text-[#2B1B1B] hover:text-[#7B1E3A] bg-[#FFF8F0] border border-[#F2E8DC] hover:bg-[#F8EFE6] px-3 py-1.5 rounded-xl transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-[#D4AF7A]" />
            .TXT
          </a>
          {translatedSegments.length > 0 && (
            <a
              href={`/api/download/srt/${projectId}`}
              download
              className="flex items-center gap-1.5 text-xs font-bold text-[#7B1E3A] bg-[#FFF8F0] border border-[#D4AF7A]/30 hover:bg-[#F8EFE6] px-3 py-1.5 rounded-xl transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#D4AF7A]" />
              .SRT
            </a>
          )}
        </div>
      </div>

      {/* Full Text Block */}
      <div className="bg-[#FFF8F0] border border-[#F2E8DC] rounded-2xl p-5">
        <span className="text-[10px] font-bold text-[#D4AF7A] uppercase tracking-widest block mb-2">
          Full {displayLangLabel} Transcript
        </span>
        {displayText ? (
          <p className="text-xs sm:text-sm font-semibold text-[#2B1B1B] leading-relaxed">
            {displayText}
          </p>
        ) : (
          <p className="text-xs text-[#7A6B6B] italic font-semibold">
            {isTranslated ? "Translation not yet available." : "Transcript not yet available."}
          </p>
        )}
      </div>

      {/* Timestamped Segments */}
      {displaySegments.length > 0 && (
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-[#7A6B6B] uppercase tracking-widest block">
            Timestamped Segments — {displayLangLabel}
          </span>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {displaySegments.map((seg, idx) => (
              <div
                key={idx}
                className="flex gap-3.5 items-start text-xs bg-white border border-[#F2E8DC] rounded-xl px-4 py-3"
              >
                <span className="shrink-0 font-mono text-[10px] font-bold text-[#7B1E3A] bg-[#FFF8F0] border border-[#D4AF7A]/30 px-2.5 py-1 rounded-lg mt-0.5 whitespace-nowrap">
                  {seg.start.toFixed(2)}s
                </span>
                <p className="text-[#2B1B1B] leading-relaxed font-semibold">{seg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
