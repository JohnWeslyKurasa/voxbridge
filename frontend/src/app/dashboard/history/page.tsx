"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Download,
  FileText,
  Volume2,
  Video,
  Clock,
  Globe,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface ProjectItem {
  _id: string;
  name: string;
  targetLanguage: string;
  inputType: "upload_audio" | "upload_video" | "microphone" | "text";
  status: "idle" | "processing" | "completed" | "failed";
  createdAt: string;
  sourceMedia?: {
    mediaType: "audio" | "video";
    duration: number;
  };
  translation?: {
    transcriptText: string;
    translatedText: string;
    detectedLanguage?: string;
    ttsAudioUrl?: string;
    outputVideoUrl?: string;
  };
}

/**
 * HistoryPage — /dashboard/history (Bright Luxury Theme)
 */
export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const completedProjects = projects.filter((p) => p.status === "completed");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B1B1B] tracking-tight flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
            <History className="h-5 w-5 text-[#D4AF7A]" />
          </div>
          Translation History & Logs
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6B6B] font-semibold mt-1">
          A complete timeline of all your completed translations, output files, and downloadable assets.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[20px] border border-[#F2E8DC] shadow-soft space-y-1">
          <p className="text-xs font-bold text-[#7A6B6B] uppercase tracking-wider">Completed Jobs</p>
          <p className="text-2xl font-extrabold text-[#2B1B1B]">{completedProjects.length}</p>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#F2E8DC] shadow-soft space-y-1">
          <p className="text-xs font-bold text-[#7A6B6B] uppercase tracking-wider">Languages Translated</p>
          <p className="text-2xl font-extrabold text-[#7B1E3A]">
            {new Set(completedProjects.map((p) => p.targetLanguage)).size}
          </p>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#F2E8DC] shadow-soft space-y-1">
          <p className="text-xs font-bold text-[#7A6B6B] uppercase tracking-wider">Generated Outputs</p>
          <p className="text-2xl font-extrabold text-emerald-700">
            {completedProjects.reduce((acc, p) => acc + (p.translation?.ttsAudioUrl ? 1 : 0) + (p.translation?.outputVideoUrl ? 1 : 0), 0)}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-7 w-7 text-[#7B1E3A] animate-spin" />
          <p className="text-xs font-semibold text-[#7A6B6B]">Loading history...</p>
        </div>
      )}

      {/* History Table */}
      {!loading && completedProjects.length > 0 && (
        <div className="bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FFF8F0] text-[#7A6B6B] font-bold uppercase tracking-wider border-b border-[#F2E8DC]">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Project</th>
                <th className="p-4">Route</th>
                <th className="p-4">Downloads</th>
                <th className="p-4 pr-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E8DC] text-[#2B1B1B] font-semibold">
              {completedProjects.map((p) => (
                <tr key={p._id} className="hover:bg-[#FFF8F0]/50 transition-colors">
                  <td className="p-4 pl-6 text-[#7A6B6B] whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                      <Clock className="h-3.5 w-3.5 text-[#D4AF7A]" />
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-4 font-bold max-w-[180px] truncate" title={p.name}>
                    {p.name}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-[#2B1B1B] bg-[#FFF8F0] border border-[#F2E8DC] px-3 py-1 rounded-full font-bold">
                      <Globe className="h-3 w-3 text-[#D4AF7A]" />
                      {(p.translation?.detectedLanguage || "AUTO").toUpperCase()} → <span className="text-[#7B1E3A]">{p.targetLanguage}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/api/download/txt/${p._id}`}
                        download
                        className="p-1.5 rounded-xl border border-[#F2E8DC] bg-[#FFF8F0] hover:bg-[#F8EFE6] text-[#2B1B1B] transition-colors"
                        title="Download .txt"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#D4AF7A]" />
                      </a>
                      <a
                        href={`/api/download/srt/${p._id}`}
                        download
                        className="p-1.5 rounded-xl border border-[#F2E8DC] bg-[#FFF8F0] hover:bg-[#F8EFE6] text-[#7B1E3A] transition-colors"
                        title="Download .srt"
                      >
                        <Download className="h-3.5 w-3.5 text-[#7B1E3A]" />
                      </a>
                      {p.translation?.ttsAudioUrl && (
                        <a
                          href={p.translation.ttsAudioUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl border border-[#D4AF7A]/30 bg-[#FFF8F0] hover:bg-[#F8EFE6] text-[#7B1E3A] transition-colors"
                          title="Download MP3"
                        >
                          <Volume2 className="h-3.5 w-3.5 text-[#7B1E3A]" />
                        </a>
                      )}
                      {p.translation?.outputVideoUrl && (
                        <a
                          href={p.translation.outputVideoUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl border border-[#D4AF7A]/30 bg-[#FFF8F0] hover:bg-[#F8EFE6] text-[#7B1E3A] transition-colors"
                          title="Download MP4"
                        >
                          <Video className="h-3.5 w-3.5 text-[#D4AF7A]" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Link
                      href={`/dashboard/project/${p._id}`}
                      className="inline-flex items-center gap-1 text-[#7B1E3A] font-bold hover:underline"
                    >
                      Project
                      <ArrowRight className="h-3 w-3 text-[#D4AF7A]" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && completedProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[20px] border border-[#F2E8DC] text-center space-y-2 shadow-soft">
          <History className="h-10 w-10 text-[#D4AF7A]" />
          <p className="text-sm font-bold text-[#2B1B1B]">No translation history yet</p>
          <p className="text-xs text-[#7A6B6B] font-semibold">Completed jobs will automatically appear here in your timeline.</p>
        </div>
      )}
    </div>
  );
}
