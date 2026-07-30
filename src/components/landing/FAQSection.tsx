"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * FAQSection Component - Bright Luxury Theme
 */
export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the Voice Identity Cloning work?",
      a: "VoxBridge AI captures a short audio fingerprint of the speaker's vocal texture, accents, and emotional inflections. We then synthesize the translated text using that identical vocal fingerprint via our generative voice engine, ensuring translations sound exactly like you.",
    },
    {
      q: "What video and audio formats are supported?",
      a: "We support a wide array of formats. For video, we accept MP4, MOV, AVI, MKV, and WEBM. For audio, you can upload MP3, WAV, AAC, FLAC, and M4A. Max file upload size on standard accounts is 500MB.",
    },
    {
      q: "How accurate is the realistic lip sync feature?",
      a: "Extremely accurate. Using visual neural models, we analyze facial geometry and synthesize the mouth movements to align perfectly with the target translation phonemes, creating a natural look that reduces visual discrepancy.",
    },
    {
      q: "Can I download translations as subtitles?",
      a: "Yes! Every project automatically transcribes and generates downloadable subtitle files in SRT, VTT formats, as well as a plain text transcript (TXT) and the rendered media files (MP3/MP4).",
    },
    {
      q: "How does pricing and credits work?",
      a: "VoxBridge AI operates on a credits system. Each minute of translated audio costs 1 credit, while video translation (including lip sync) costs 3 credits per minute. The Free Tier includes 15 credits to test all features.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white border-t border-[#F2E8DC]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#D4AF7A]">FAQ</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-[#2B1B1B] tracking-tight">
            Frequently Asked Questions
          </p>
          <p className="text-sm sm:text-base text-[#7A6B6B] font-medium">
            Have questions about credits, processing layers, or file types? We have got you covered.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-[20px] border border-[#F2E8DC] bg-[#FFF8F0]/50 hover:bg-white shadow-soft overflow-hidden transition-all duration-300 hover:border-[#D4AF7A]/50"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-[#2B1B1B] hover:text-[#7B1E3A] transition-colors"
                >
                  <span className="text-sm sm:text-base pr-4">{faq.q}</span>
                  <div className="flex-shrink-0 p-2 rounded-xl bg-white border border-[#F2E8DC] text-[#7B1E3A]">
                    {isOpen ? <Minus className="h-4 w-4 text-[#D4AF7A]" /> : <Plus className="h-4 w-4 text-[#D4AF7A]" />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 text-xs sm:text-sm leading-relaxed text-[#7A6B6B] font-semibold border-t border-[#F2E8DC]/50">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
