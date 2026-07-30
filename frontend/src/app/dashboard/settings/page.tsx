"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Globe,
  Volume2,
  Database,
  Save,
  CheckCircle2,
} from "lucide-react";

/**
 * SettingsPage — /dashboard/settings (Bright Luxury Theme)
 */
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const [targetLang, setTargetLang] = useState("Hindi");
  const [autoTTS, setAutoTTS] = useState(true);
  const [voiceModel, setVoiceModel] = useState("medium");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("voxbridge_default_lang");
    if (savedLang) setTargetLang(savedLang);
    const savedAutoTTS = localStorage.getItem("voxbridge_auto_tts");
    if (savedAutoTTS) setAutoTTS(savedAutoTTS === "true");
  }, []);

  const handleSave = () => {
    localStorage.setItem("voxbridge_default_lang", targetLang);
    localStorage.setItem("voxbridge_auto_tts", String(autoTTS));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B1B1B] tracking-tight flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
            <SettingsIcon className="h-5 w-5 text-[#D4AF7A]" />
          </div>
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6B6B] font-semibold mt-1">
          Customize your default translation targets, speech synthesis options, and AI engine preferences.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Settings saved successfully!
        </div>
      )}

      {/* Settings Grid */}
      <div className="space-y-5">
        {/* Section 1: Translation Defaults */}
        <div className="bg-white rounded-[20px] border border-[#F2E8DC] p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#F2E8DC] pb-3">
            <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
              <Globe className="h-4 w-4 text-[#D4AF7A]" />
            </div>
            <h2 className="text-sm font-bold text-[#2B1B1B]">Translation Defaults</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#7A6B6B] uppercase tracking-wider">
                Default Target Language
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full rounded-xl border border-[#F2E8DC] bg-[#FFF8F0] p-3 text-xs font-bold text-[#2B1B1B] focus:border-[#7B1E3A] focus:bg-white focus:outline-none cursor-pointer"
              >
                {["Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "English"].map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#7A6B6B] uppercase tracking-wider">
                Whisper ASR Model Size
              </label>
              <select
                disabled
                value="tiny"
                className="w-full rounded-xl border border-[#F2E8DC] bg-[#FFF8F0]/50 p-3 text-xs font-bold text-[#7A6B6B] cursor-not-allowed"
              >
                <option value="tiny">Tiny (INT8 CPU Optimized - Fastest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Text to Speech Settings */}
        <div className="bg-white rounded-[20px] border border-[#F2E8DC] p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#F2E8DC] pb-3">
            <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
              <Volume2 className="h-4 w-4 text-[#7B1E3A]" />
            </div>
            <h2 className="text-sm font-bold text-[#2B1B1B]">Piper Text-to-Speech (TTS)</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#2B1B1B]">Auto-Generate Speech</p>
                <p className="text-[11px] text-[#7A6B6B] font-semibold">Automatically generate Piper TTS audio after transcription completes.</p>
              </div>
              <input
                type="checkbox"
                checked={autoTTS}
                onChange={(e) => setAutoTTS(e.target.checked)}
                className="h-4 w-4 accent-[#7B1E3A] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#7A6B6B] uppercase tracking-wider">
                Piper Voice Model Quality
              </label>
              <select
                value={voiceModel}
                onChange={(e) => setVoiceModel(e.target.value)}
                className="w-full rounded-xl border border-[#F2E8DC] bg-[#FFF8F0] p-3 text-xs font-bold text-[#2B1B1B] focus:border-[#7B1E3A] focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="medium">Medium Quality (Fastest download & high clarity)</option>
                <option value="high">High Quality (Detailed sample rate)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Storage & Database Integration */}
        <div className="bg-white rounded-[20px] border border-[#F2E8DC] p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#F2E8DC] pb-3">
            <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
              <Database className="h-4 w-4 text-[#D4AF7A]" />
            </div>
            <h2 className="text-sm font-bold text-[#2B1B1B]">Connected Services</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F2E8DC] space-y-1">
              <div className="flex items-center justify-between font-bold text-[#7B1E3A]">
                <span>MongoDB Atlas</span>
                <span className="text-[10px] bg-[#7B1E3A]/10 border border-[#7B1E3A]/20 px-2.5 py-0.5 rounded-full text-[#7B1E3A]">Connected</span>
              </div>
              <p className="text-[11px] text-[#7A6B6B] font-semibold">Storing Projects, Translations, and Media references.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F2E8DC] space-y-1">
              <div className="flex items-center justify-between font-bold text-[#2B1B1B]">
                <span>Cloudinary CDN</span>
                <span className="text-[10px] bg-[#D4AF7A]/20 border border-[#D4AF7A]/40 px-2.5 py-0.5 rounded-full text-[#7B1E3A]">Connected</span>
              </div>
              <p className="text-[11px] text-[#7A6B6B] font-semibold">Direct asset uploads, signed transfers, and MP3/MP4 delivery.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-6 py-3 text-xs font-bold text-white shadow-md shadow-[#7B1E3A]/20 hover:opacity-95 transition-all cursor-pointer border border-[#D4AF7A]/30"
        >
          <Save className="h-4 w-4 text-[#D4AF7A]" />
          Save Preferences
        </button>
      </div>
    </div>
  );
}
