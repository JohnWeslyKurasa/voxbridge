"use client";

import { UploadCloud, FileAudio, Globe2, Mic, PlaySquare, Download } from "lucide-react";
import { motion } from "framer-motion";

/**
 * HowItWorksSection Component - Bright Luxury Theme
 */
export default function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: UploadCloud,
      title: "Upload Media",
      desc: "Drag & drop your audio or video file (MP4, MP3, WAV, etc.) to the dashboard secure upload module.",
    },
    {
      num: "02",
      icon: FileAudio,
      title: "Speech Recognition",
      desc: "Our Whisper engine automatically transcribes the audio, generating timestamps and speaker identities.",
    },
    {
      num: "03",
      icon: Globe2,
      title: "Translate Text",
      desc: "AI translations localize transcripts into 40+ target languages while retaining expressions and idiomatic phrasing.",
    },
    {
      num: "04",
      icon: Mic,
      title: "Voice Cloning",
      desc: "Neural voice APIs generate translations using a clone of the speaker's original voice tone and emotion.",
    },
    {
      num: "05",
      icon: PlaySquare,
      title: "Lip Sync (Video)",
      desc: "For video submissions, visual neural models synthesize lip movements to seamlessly match the newly translated output.",
    },
    {
      num: "06",
      icon: Download,
      title: "Render & Download",
      desc: "Export localized MP4, MP3, or grab transcript files (TXT, SRT, VTT) directly from the project history board.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#FFF8F0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Title area */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#D4AF7A]">Workflow</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-[#2B1B1B] tracking-tight">
            How VoxBridge Translates Media
          </p>
          <p className="text-base sm:text-lg text-[#7A6B6B] max-w-2xl mx-auto font-medium">
            From upload to download, see the exact steps our backend takes to orchestrate state-of-the-art AI networks.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="relative flex flex-col items-start p-7 rounded-[20px] border border-[#F2E8DC] bg-white shadow-soft hover:shadow-[0_12px_36px_rgba(123,30,58,0.08)] hover:border-[#D4AF7A]/50 transition-all duration-300 group"
              >
                {/* Accent number */}
                <div className="absolute top-5 right-6 text-4xl font-extrabold text-[#D4AF7A]/30 group-hover:text-[#D4AF7A]/60 transition-colors pointer-events-none select-none">
                  {step.num}
                </div>

                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-md shadow-[#7B1E3A]/20 mb-6 border border-[#D4AF7A]/30">
                  <Icon className="h-6 w-6 text-[#D4AF7A]" />
                </div>

                <h3 className="text-lg font-bold text-[#2B1B1B] mb-2 group-hover:text-[#7B1E3A] transition-colors">
                  {step.title}
                </h3>
                
                <p className="text-xs sm:text-sm leading-relaxed text-[#7A6B6B] font-semibold">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
