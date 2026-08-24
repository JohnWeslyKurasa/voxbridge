"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Folder,
  Activity,
  Award,
  Video,
  Volume2,
  ArrowRight,
  Plus,
  FileText,
  X,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectItem {
  _id: string;
  name: string;
  targetLanguage: string;
  inputType: "upload_audio" | "upload_video" | "microphone";
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
    segments?: { start: number; end: number; text: string }[];
    translatedSegments?: { start: number; end: number; text: string }[];
    ttsAudioUrl?: string;
    ttsStatus?: string;
    outputVideoUrl?: string;
    videoMergeStatus?: string;
  };
}

interface UserStatus {
  plan: "free" | "pro" | "enterprise";
  projectsUsed: number;
  trialLimit: number;
  trialExpired: boolean;
  projectsRemaining: number;
  isPro: boolean;
}

/**
 * Dashboard Main Page - Bright Luxury Theme
 */
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  
  // Selected transcript parameters displaying original + translation
  const [selectedTranscript, setSelectedTranscript] = useState<{
    name: string;
    targetLanguage: string;
    text: string;
    translatedText: string;
    segments: { start: number; end: number; text: string }[];
    translatedSegments: { start: number; end: number; text: string }[];
  } | null>(null);

  // Modal active tab selector ("original" or "translated")
  const [activeTab, setActiveTab] = useState<"original" | "translated">("translated");

  // Fetch projects from local API connected to MongoDB Atlas
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch {
        // Quietly handle transient dev server compilation pauses
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();

    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user trial/plan status
  useEffect(() => {
    async function fetchUserStatus() {
      try {
        const res = await fetch("/api/user/status");
        if (res.ok) {
          const data = await res.json();
          if (data.success) setUserStatus(data);
        }
      } catch {}
    }
    fetchUserStatus();
  }, [projects.length]); // Re-fetch whenever projects change

  // Compute dynamic stats from live projects list
  const totalProjects = projects.length;
  const videoMins = projects
    .filter((p) => p.sourceMedia?.mediaType === "video")
    .reduce((acc, p) => acc + (p.sourceMedia?.duration || 0), 0);
  const audioMins = projects
    .filter((p) => p.sourceMedia?.mediaType === "audio")
    .reduce((acc, p) => acc + (p.sourceMedia?.duration || 0), 0);
  const completedJobs = projects.filter((p) => p.status === "completed").length;

  const stats = [
    { name: "Total Projects", value: totalProjects.toString(), icon: Folder, detail: "Linked database assets" },
    { name: "Video Processed", value: `${Math.round(videoMins / 60)} mins`, icon: Video, detail: "Total video duration" },
    { name: "Audio Translated", value: `${Math.round(audioMins / 60)} mins`, icon: Volume2, detail: "Total audio duration" },
    { name: "Jobs Completed", value: `${completedJobs} / ${totalProjects || 0}`, icon: Activity, detail: `${totalProjects ? Math.round((completedJobs / totalProjects) * 100) : 0}% success rate` },
  ];

  // Loader layout placeholder
  if (!isLoaded || loadingProjects) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-36 rounded-[20px] bg-white border border-[#F2E8DC] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-[20px] bg-white border border-[#F2E8DC] w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-[20px] bg-white border border-[#F2E8DC] w-full" />
          <div className="h-96 rounded-[20px] bg-white border border-[#F2E8DC] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card Banner Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[20px] border border-[#F2E8DC] bg-white p-6 sm:p-8 shadow-soft flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-[240px] h-[240px] rounded-full bg-[#D4AF7A]/10 blur-[50px] pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D4AF7A] tracking-wider uppercase">Executive Voice Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2B1B1B]">
            Welcome, <span className="gradient-text">{user?.firstName || "Creator"}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6B6B] max-w-xl leading-relaxed font-medium">
            Translate files, clone vocal signatures, transcribe speech timelines, and sync speaker lips in one luxury workspace.
          </p>
          <div className="flex items-center gap-2 pt-2">
            {userStatus?.isPro ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7B1E3A]/10 to-[#D4AF7A]/10 border border-[#D4AF7A]/40 px-3 py-1 text-xs font-bold text-[#7B1E3A]">
                <Award className="w-3.5 h-3.5 text-[#D4AF7A]" />
                Pro Studio Plan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8F0] border border-[#D4AF7A]/40 px-3 py-1 text-xs font-bold text-[#7A6B6B]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF7A]" />
                Free Trial — {userStatus ? `${userStatus.projectsUsed}/${userStatus.trialLimit} projects used` : "Loading..."}
              </span>
            )}
            <span className="text-xs text-[#D4AF7A] font-bold">•</span>
            <span className="text-xs font-semibold text-[#7A6B6B]">
              {userStatus?.isPro ? "Unlimited projects" : `${userStatus?.projectsRemaining ?? "—"} projects remaining`}
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/upload"
          className="group shrink-0 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#7B1E3A]/20 hover:shadow-lg hover:shadow-[#7B1E3A]/30 transition-all duration-200 active:scale-95 border border-[#D4AF7A]/30 w-full md:w-auto text-center"
        >
          <Plus className="w-4 h-4 text-[#D4AF7A]" />
          Quick Upload File
        </Link>
      </motion.div>

      {/* Analytics / Quick Stats Column-Wise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-white p-5 rounded-[20px] border border-[#F2E8DC] shadow-soft flex items-center justify-between hover:border-[#D4AF7A]/50 transition-all group"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-[#7A6B6B] uppercase tracking-wider block">{s.name}</span>
                <span className="text-2xl font-extrabold text-[#2B1B1B] block">{s.value}</span>
                <p className="text-[11px] font-semibold text-[#7A6B6B]">{s.detail}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#F2E8DC] text-[#7B1E3A] group-hover:bg-gradient-to-br group-hover:from-[#7B1E3A] group-hover:to-[#A23B5A] group-hover:text-white transition-all shrink-0">
                <Icon className="h-6 w-6 text-[#D4AF7A]" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Free Trial Progress Banner (only for free plan users) ───────── */}
      {userStatus && !userStatus.isPro && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`relative overflow-hidden rounded-[20px] border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
            userStatus.trialExpired
              ? "border-red-200 bg-gradient-to-r from-red-50 to-rose-50"
              : "border-[#D4AF7A]/40 bg-gradient-to-r from-[#FFF8F0] to-white"
          }`}
        >
          <div className="absolute top-0 right-0 w-[180px] h-[180px] rounded-full bg-[#D4AF7A]/8 blur-[40px] pointer-events-none" />

          <div className="flex-1 space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              {userStatus.trialExpired ? (
                <span className="text-sm font-extrabold text-red-600">🔒 Free Trial Ended</span>
              ) : (
                <span className="text-sm font-extrabold text-[#2B1B1B]">
                  🎯 Free Trial — {userStatus.projectsUsed} of {userStatus.trialLimit} projects used
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-[#F2E8DC] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (userStatus.projectsUsed / userStatus.trialLimit) * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  userStatus.trialExpired
                    ? "bg-gradient-to-r from-red-400 to-rose-500"
                    : userStatus.projectsUsed >= userStatus.trialLimit - 3
                    ? "bg-gradient-to-r from-amber-400 to-orange-500"
                    : "bg-gradient-to-r from-[#7B1E3A] to-[#D4AF7A]"
                }`}
              />
            </div>

            <p className="text-[11px] font-semibold text-[#7A6B6B]">
              {userStatus.trialExpired
                ? "You've used all your free projects. Upgrade to Pro for unlimited translations, voice cloning, and video dubbing."
                : `${userStatus.projectsRemaining} project${userStatus.projectsRemaining !== 1 ? "s" : ""} remaining on your free trial.`}
            </p>
          </div>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert("Contact support to upgrade your plan."); }}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
              userStatus.trialExpired
                ? "bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] text-white shadow-md shadow-[#7B1E3A]/25 hover:shadow-lg"
                : "bg-white border border-[#D4AF7A]/50 text-[#7B1E3A] hover:bg-[#FFF8F0]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {userStatus.trialExpired ? "Upgrade to Pro" : "Upgrade Plan"}
          </a>
        </motion.div>
      )}

      {/* Bottom Main Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Recent Projects Table List */}
        <div className="lg:col-span-2 bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft overflow-hidden flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="p-6 border-b border-[#F2E8DC] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#2B1B1B] text-base">Recent Projects</h3>
                <p className="text-xs font-semibold text-[#7A6B6B]">Manage and track your latest media localized versions</p>
              </div>
              <Link
                href="/dashboard/projects"
                className="flex items-center gap-1.5 text-xs font-bold text-[#7B1E3A] hover:underline transition-colors"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF7A]" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center text-[#7B1E3A]">
                  <Folder className="h-6 w-6 text-[#D4AF7A]" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-sm font-bold text-[#2B1B1B]">No projects found</p>
                  <p className="text-xs text-[#7A6B6B] font-semibold">Upload an audio or video file to trigger automatic Whisper transcriptions.</p>
                </div>
                <Link
                  href="/dashboard/upload"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7B1E3A] hover:underline pt-2"
                >
                  Upload a file now
                  <ArrowRight className="h-3.5 w-3.5 text-[#D4AF7A]" />
                </Link>
              </div>
            ) : (
              /* Responsive Table Container */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#FFF8F0] text-[#7A6B6B] text-[11px] font-bold uppercase tracking-wider border-b border-[#F2E8DC]">
                      <th className="p-4 pl-6">Filename</th>
                      <th className="p-4">Detected → Target</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">TTS</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2E8DC] text-[#2B1B1B]">
                    {projects.map((p) => (
                      <tr key={p._id} className="hover:bg-[#FFF8F0]/50 transition-colors">
                        <td className="p-4 pl-6 font-bold text-xs max-w-[180px] truncate" title={p.name}>
                          {p.name}
                        </td>
                        <td className="p-4 font-semibold text-xs">
                          <span className="text-[#7A6B6B]">{(p.translation?.detectedLanguage || "?").toUpperCase()}</span>
                          <span className="text-[#D4AF7A] mx-1">→</span>
                          <span className="font-bold text-[#7B1E3A]">{p.targetLanguage}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            p.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.status === "failed"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-[#FFF8F0] text-[#7B1E3A] border border-[#D4AF7A]/40 animate-pulse"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {p.translation?.ttsStatus === "completed" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#7B1E3A]">🔊 Ready</span>
                          ) : p.translation?.ttsStatus === "processing" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D4AF7A]">🔄 TTS...</span>
                          ) : p.translation?.transcriptText ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              Transcript
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7A6B6B]">Pending</span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.translation?.transcriptText && (
                              <button
                                onClick={() => {
                                  if (p.translation) {
                                    setSelectedTranscript({
                                      name: p.name,
                                      targetLanguage: p.targetLanguage,
                                      text: p.translation.transcriptText,
                                      translatedText: p.translation.translatedText || "",
                                      segments: p.translation.segments || [],
                                      translatedSegments: p.translation.translatedSegments || []
                                    });
                                    setActiveTab(p.translation.translatedText ? "translated" : "original");
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#F2E8DC] bg-[#FFF8F0] px-3 py-1.5 text-xs font-bold text-[#2B1B1B] hover:bg-white transition-all shadow-sm"
                              >
                                <FileText className="h-3.5 w-3.5 text-[#D4AF7A]" />
                                Preview
                              </button>
                            )}
                            <Link
                              href={`/dashboard/project/${p._id}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-3 py-1.5 text-xs font-bold text-white hover:opacity-95 shadow-sm transition-all border border-[#D4AF7A]/30"
                            >
                              Details
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Account Summary & Free Unlimited Studio Access */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[20px] border border-[#F2E8DC] shadow-soft space-y-4">
            <h3 className="font-bold text-[#2B1B1B] text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Unlimited Free Access</span>
              <Sparkles className="h-4 w-4 text-[#D4AF7A]" />
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#7A6B6B]">
                <span>Status</span>
                <span className="text-emerald-700 font-extrabold uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">100% Free & Unlimited</span>
              </div>
              <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 w-full rounded-full" />
              </div>
              <p className="text-[11px] text-[#7A6B6B] leading-relaxed font-semibold">
                Enjoy unlimited AI translation, voice matching, audio generation, and video processing with zero limits and zero credit costs.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[20px] border border-[#F2E8DC] shadow-soft space-y-4 text-xs">
            <h3 className="font-bold text-[#2B1B1B] text-xs uppercase tracking-wider">Recent Activity</h3>
            <ul className="space-y-3 font-semibold text-[#7A6B6B]">
              <li className="flex justify-between gap-2 border-b border-[#F2E8DC] pb-2.5">
                <span className="text-[#2B1B1B]">🌐 Dual Translation complete</span>
                <span className="text-[10px] text-[#D4AF7A] font-bold">Just now</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-[#F2E8DC] pb-2.5">
                <span className="text-[#2B1B1B]">🎙️ Transcript created</span>
                <span className="text-[10px] text-[#D4AF7A] font-bold">Just now</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-[#F2E8DC] pb-2.5">
                <span className="text-[#2B1B1B]">📁 Uploaded media asset</span>
                <span className="text-[10px] text-[#D4AF7A] font-bold">5 mins ago</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Transcript Modal Overlay */}
      <AnimatePresence>
        {selectedTranscript && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B1B1B]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[20px] shadow-2xl border border-[#F2E8DC] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#F2E8DC] flex items-center justify-between bg-[#FFF8F0]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
                    <FileText className="h-5 w-5 text-[#D4AF7A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2B1B1B] text-base max-w-[360px] truncate" title={selectedTranscript.name}>
                      {selectedTranscript.name}
                    </h3>
                    <p className="text-[10px] text-[#D4AF7A] uppercase font-bold tracking-wider">Dual Whisper & Meta NLLB-200</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTranscript(null)}
                  className="rounded-xl p-2 text-[#7A6B6B] hover:bg-white hover:text-[#7B1E3A] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tab Selector Buttons */}
              <div className="px-6 pt-4 border-b border-[#F2E8DC] bg-white flex gap-6">
                <button
                  onClick={() => setActiveTab("translated")}
                  disabled={!selectedTranscript.translatedText}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "translated"
                      ? "border-[#D4AF7A] text-[#7B1E3A]"
                      : "border-transparent text-[#7A6B6B] hover:text-[#2B1B1B]"
                  } ${!selectedTranscript.translatedText ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Translated ({selectedTranscript.targetLanguage})
                </button>
                <button
                  onClick={() => setActiveTab("original")}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "original"
                      ? "border-[#D4AF7A] text-[#7B1E3A]"
                      : "border-transparent text-[#7A6B6B] hover:text-[#2B1B1B]"
                  }`}
                >
                  Original Transcript (English)
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-[#2B1B1B]">
                {/* Full text summary block */}
                <div className="bg-[#FFF8F0] border border-[#F2E8DC] rounded-2xl p-5 space-y-2">
                  <span className="text-[10px] font-bold text-[#D4AF7A] uppercase tracking-widest block">
                    {activeTab === "translated" ? `Full Translated Text (${selectedTranscript.targetLanguage})` : "Full Original Text"}
                  </span>
                  <p className="font-semibold text-[#2B1B1B] leading-relaxed">
                    {activeTab === "translated" ? selectedTranscript.translatedText : selectedTranscript.text}
                  </p>
                </div>

                {/* Segments timestamps list */}
                <div className="space-y-3.5">
                  <span className="text-[10px] font-bold text-[#7A6B6B] uppercase tracking-widest block pb-2 border-b border-[#F2E8DC]">
                    Timestamped Segments
                  </span>
                  
                  <div className="divide-y divide-[#F2E8DC] max-h-[260px] overflow-y-auto pr-2 space-y-2">
                    {activeTab === "translated" ? (
                      selectedTranscript.translatedSegments.map((seg, idx) => (
                        <div key={idx} className="flex gap-4 pt-3 items-start text-xs font-semibold">
                          <span className="shrink-0 font-mono text-[10px] text-[#7B1E3A] bg-[#FFF8F0] border border-[#D4AF7A]/30 px-2.5 py-1 rounded-lg mt-0.5">
                            {seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s
                          </span>
                          <p className="text-[#2B1B1B] leading-relaxed font-medium">
                            {seg.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      selectedTranscript.segments.map((seg, idx) => (
                        <div key={idx} className="flex gap-4 pt-3 items-start text-xs font-semibold">
                          <span className="shrink-0 font-mono text-[10px] text-[#7B1E3A] bg-[#FFF8F0] border border-[#D4AF7A]/30 px-2.5 py-1 rounded-lg mt-0.5">
                            {seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s
                          </span>
                          <p className="text-[#2B1B1B] leading-relaxed font-medium">
                            {seg.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#F2E8DC] bg-[#FFF8F0] flex justify-end gap-2">
                <button
                  onClick={() => setSelectedTranscript(null)}
                  className="rounded-xl border border-[#F2E8DC] bg-white px-5 py-2.5 text-xs font-bold text-[#2B1B1B] hover:bg-[#F8EFE6] shadow-sm transition-all"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
