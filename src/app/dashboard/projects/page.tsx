"use client";

import { useState, useEffect, ComponentType } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Search,
  Grid,
  List as ListIcon,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Loader2,
  Globe,
  Mic,
  Upload,
  Video,
  Type,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    ttsStatus?: string;
  };
}

const INPUT_TYPE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  microphone: Mic,
  upload_audio: Upload,
  upload_video: Video,
  text: Type,
};

/**
 * ProjectsPage — /dashboard/projects (Bright Luxury Theme)
 */
export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error("Failed to fetch projects:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert("Failed to delete project.");
      }
    } catch (e) {
      console.error("Delete error:", e);
      alert("Error deleting project.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter projects by search query and status filter
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.targetLanguage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.translation?.detectedLanguage && p.translation.detectedLanguage.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B1B1B] tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
              <FolderKanban className="h-5 w-5 text-[#D4AF7A]" />
            </div>
            Projects Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6B6B] font-semibold mt-1">
            Manage, search, preview, and organize all your VoxBridge AI translations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProjects}
            className="p-2.5 rounded-xl border border-[#F2E8DC] bg-white text-[#7A6B6B] hover:bg-[#FFF8F0] hover:text-[#7B1E3A] transition-colors shadow-sm cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#7B1E3A]/20 hover:opacity-95 transition-all border border-[#D4AF7A]/30"
          >
            <Plus className="h-4 w-4 text-[#D4AF7A]" />
            New Project
          </Link>
        </div>
      </div>

      {/* Control Bar: Search, Status Filters, View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-[20px] border border-[#F2E8DC] shadow-soft">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF7A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by filename or language..."
            className="w-full pl-10 pr-4 py-2 text-xs font-bold rounded-xl border border-[#F2E8DC] bg-[#FFF8F0] text-[#2B1B1B] focus:outline-none focus:border-[#7B1E3A] focus:bg-white placeholder:text-[#7A6B6B]"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {["all", "completed", "processing", "failed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? "bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] text-white shadow-sm border border-[#D4AF7A]/30"
                  : "text-[#7A6B6B] hover:bg-[#FFF8F0] hover:text-[#2B1B1B]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Layout Mode Toggle */}
        <div className="flex items-center gap-1 border-l border-[#F2E8DC] pl-3">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              viewMode === "grid" ? "bg-[#FFF8F0] text-[#7B1E3A] border border-[#F2E8DC]" : "text-[#7A6B6B] hover:text-[#2B1B1B]"
            }`}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              viewMode === "list" ? "bg-[#FFF8F0] text-[#7B1E3A] border border-[#F2E8DC]" : "text-[#7A6B6B] hover:text-[#2B1B1B]"
            }`}
            title="List View"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-[#7B1E3A] animate-spin" />
          <p className="text-xs font-bold text-[#7A6B6B]">Loading your projects...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-[20px] border border-[#F2E8DC] text-center space-y-3 shadow-soft">
          <FolderKanban className="h-12 w-12 text-[#D4AF7A]" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#2B1B1B]">No projects found</h3>
            <p className="text-xs text-[#7A6B6B] max-w-sm font-semibold">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search query or status filter."
                : "Get started by creating your first audio, video, or text translation project."}
            </p>
          </div>
          {!searchQuery && statusFilter === "all" && (
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#7B1E3A]/20"
            >
              <Plus className="h-4 w-4 text-[#D4AF7A]" />
              Create Project
            </Link>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredProjects.map((p) => {
              const TypeIcon = INPUT_TYPE_ICONS[p.inputType] || Upload;
              return (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[20px] border border-[#F2E8DC] p-6 shadow-soft hover:shadow-[0_12px_36px_rgba(123,30,58,0.08)] hover:border-[#D4AF7A]/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* Header line: icon + name + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center shrink-0">
                          <TypeIcon className="h-4 w-4 text-[#7B1E3A]" />
                        </div>
                        <h3 className="text-sm font-bold text-[#2B1B1B] truncate" title={p.name}>
                          {p.name}
                        </h3>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        p.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : p.status === "failed"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-[#FFF8F0] text-[#7B1E3A] border border-[#D4AF7A]/40 animate-pulse"
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    {/* Languages info */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#2B1B1B] bg-[#FFF8F0] p-2.5 rounded-xl border border-[#F2E8DC]">
                      <Globe className="h-3.5 w-3.5 text-[#D4AF7A] shrink-0" />
                      <span className="text-[#7A6B6B]">{(p.translation?.detectedLanguage || "AUTO").toUpperCase()}</span>
                      <span className="text-[#D4AF7A]">→</span>
                      <span className="text-[#7B1E3A] font-bold">{p.targetLanguage}</span>
                    </div>

                    {/* Snippet preview */}
                    {p.translation?.translatedText && (
                      <p className="text-xs text-[#7A6B6B] line-clamp-2 italic bg-[#FFF8F0]/50 p-2.5 rounded-xl font-medium border border-[#F2E8DC]/50">
                        &ldquo;{p.translation.translatedText}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#F2E8DC] flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#7A6B6B]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(p._id, p.name)}
                        disabled={deletingId === p._id}
                        className="p-1.5 rounded-xl text-[#7A6B6B] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        {deletingId === p._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <Link
                        href={`/dashboard/project/${p._id}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#FFF8F0] border border-[#D4AF7A]/30 px-3 py-1.5 text-xs font-bold text-[#7B1E3A] hover:bg-white transition-colors"
                      >
                        View
                        <ExternalLink className="h-3 w-3 text-[#D4AF7A]" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filteredProjects.length > 0 && (
        <div className="bg-white rounded-[20px] border border-[#F2E8DC] shadow-soft overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FFF8F0] text-[#7A6B6B] font-bold uppercase tracking-wider border-b border-[#F2E8DC]">
                <th className="p-4 pl-6">Project Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Translation</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E8DC] text-[#2B1B1B] font-semibold">
              {filteredProjects.map((p) => {
                const TypeIcon = INPUT_TYPE_ICONS[p.inputType] || Upload;
                return (
                  <tr key={p._id} className="hover:bg-[#FFF8F0]/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-xs max-w-[200px] truncate" title={p.name}>
                      {p.name}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2B1B1B] bg-[#FFF8F0] border border-[#F2E8DC] px-2.5 py-1 rounded-lg capitalize">
                        <TypeIcon className="h-3 w-3 text-[#D4AF7A]" />
                        {p.inputType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      {(p.translation?.detectedLanguage || "AUTO").toUpperCase()} → <span className="font-bold text-[#7B1E3A]">{p.targetLanguage}</span>
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
                    <td className="p-4 text-[#7A6B6B]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          disabled={deletingId === p._id}
                          className="p-1.5 rounded-lg text-[#7A6B6B] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete project"
                        >
                          {deletingId === p._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <Link
                          href={`/dashboard/project/${p._id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#FFF8F0] border border-[#D4AF7A]/30 px-3 py-1.5 text-xs font-bold text-[#7B1E3A] hover:bg-white transition-colors"
                        >
                          Details
                          <ExternalLink className="h-3 w-3 text-[#D4AF7A]" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
