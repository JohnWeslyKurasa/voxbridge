"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import LanguageSearchSelector from "@/components/language/LanguageSearchSelector";

export interface TextInputWorkspaceProps {
  languages: { name: string; nativeScript: string; flag: string }[];
  targetLanguage: string;
  onSuccess: (projectId: string) => void;
}

export default function TextInputWorkspace({
  languages,
  targetLanguage,
  onSuccess,
}: TextInputWorkspaceProps) {
  const [text, setText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please enter text to translate.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/text-to-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          sourceLanguage,
          targetLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process text translation.");
      }

      onSuccess(data.projectId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error processing request";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/20 p-6">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>📝</span> Text to Voice & Translation
        </h3>
        <p className="text-xs text-slate-500">
          Enter text in any supported source language. We will translate it and generate speech automatically.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Source Language Picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Source Language (Language you are typing in)
        </label>
        <LanguageSearchSelector
          languages={languages}
          value={sourceLanguage}
          onChange={setSourceLanguage}
          disabled={isSubmitting}
        />
      </div>

      {/* Text Area */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Your Text
        </label>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSubmitting}
          placeholder="Type or paste your text here (e.g. नमस्ते, how are you?)..."
          className="w-full rounded-xl border border-slate-200 p-4 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !text.trim()}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Translating & Generating Voice...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Translate & Generate Voice
          </>
        )}
      </button>
    </form>
  );
}
