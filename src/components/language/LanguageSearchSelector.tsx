"use client";

import { useState, useRef, useCallback } from "react";
import { Search, ChevronDown, Check, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** Language option definition */
export interface LanguageOption {
  name: string;
  nativeScript?: string; // Native language name (e.g. "हिन्दी" for Hindi)
  flag?: string;         // Emoji flag (optional)
}

export interface LanguageSearchSelectorProps {
  languages: LanguageOption[];
  value: string;
  onChange: (language: string) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * LanguageSearchSelector — Searchable Language Dropdown (Bright Luxury Theme)
 */
export default function LanguageSearchSelector({
  languages,
  value,
  onChange,
  disabled = false,
  label = "Target Language",
}: LanguageSearchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter languages by search query (name or native script)
  const filteredLanguages = languages.filter((lang) => {
    const q = searchQuery.toLowerCase();
    return (
      lang.name.toLowerCase().includes(q) ||
      (lang.nativeScript?.toLowerCase().includes(q) ?? false)
    );
  });

  const selectedLang = languages.find((l) => l.name === value);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery("");
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  const selectLanguage = useCallback(
    (lang: string) => {
      onChange(lang);
      closeDropdown();
    },
    [onChange, closeDropdown]
  );

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold text-[#7A6B6B] uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id="language-selector-btn"
        onClick={isOpen ? closeDropdown : openDropdown}
        disabled={disabled}
        className={`w-full flex items-center justify-between rounded-xl border border-[#F2E8DC] bg-[#FFF8F0] px-4 py-2.5 text-xs font-semibold text-left transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-[#D4AF7A]"
        } ${isOpen ? "border-[#7B1E3A] bg-white ring-2 ring-[#7B1E3A]/10 shadow-sm" : ""}`}
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#D4AF7A] shrink-0" />
          <span className="font-bold text-[#2B1B1B]">{selectedLang?.name || "Select language"}</span>
          {selectedLang?.nativeScript && (
            <span className="text-[#7A6B6B] text-xs font-semibold">({selectedLang.nativeScript})</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[#7A6B6B] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#7B1E3A]" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full max-w-xs bg-white border border-[#F2E8DC] rounded-[20px] shadow-xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-[#F2E8DC] bg-[#FFF8F0]">
              <div className="flex items-center gap-2 bg-white border border-[#F2E8DC] rounded-xl px-3 py-2">
                <Search className="h-3.5 w-3.5 text-[#D4AF7A] shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && closeDropdown()}
                  placeholder="Search language..."
                  className="flex-1 bg-transparent text-xs font-bold text-[#2B1B1B] placeholder:text-[#7A6B6B] outline-none"
                />
              </div>
            </div>

            {/* Language List */}
            <div className="max-h-52 overflow-y-auto py-1">
              {filteredLanguages.length === 0 ? (
                <div className="px-4 py-3 text-xs text-[#7A6B6B] font-semibold text-center">
                  No languages found
                </div>
              ) : (
                filteredLanguages.map((lang) => (
                  <button
                    key={lang.name}
                    type="button"
                    onClick={() => selectLanguage(lang.name)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                      lang.name === value
                        ? "bg-[#FFF8F0] text-[#7B1E3A] font-extrabold"
                        : "text-[#2B1B1B] hover:bg-[#F8EFE6] font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {lang.flag && <span className="text-base">{lang.flag}</span>}
                      <span>{lang.name}</span>
                      {lang.nativeScript && (
                        <span className="text-[#7A6B6B] text-[11px] font-normal">{lang.nativeScript}</span>
                      )}
                    </div>
                    {lang.name === value && (
                      <Check className="h-3.5 w-3.5 text-[#7B1E3A] shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeDropdown}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
