"use client";

import Link from "next/link";
import { Volume2, Video, Languages, Mic, Sparkles, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturesSection() {
  const features = [
    {
      icon: Volume2,
      title: "Audio-to-Audio Translation",
      description: "Upload any vocal track or speech recording and translate it into a target language while keeping natural delivery.",
      href: "/dashboard/upload?mode=upload_audio",
    },
    {
      icon: Video,
      title: "Video-to-Video Translation",
      description: "Fully localize video clips. Integrates speech transcription, neural translation, cloned voice-overs, and lip-syncing.",
      href: "/dashboard/upload?mode=upload_video",
    },
    {
      icon: Mic,
      title: "Voice Identity Cloning",
      description: "Preserves your exact speaking style, vocal texture, emotion, and accent across translations for maximum authenticity.",
      href: "/dashboard/settings",
    },
    {
      icon: Sparkles,
      title: "Realistic Lip Synchronization",
      description: "Applies advanced visual syncing to modify speaker mouth movements matching the translated vocal output.",
      href: "/dashboard/help",
    },
    {
      icon: Languages,
      title: "Auto-Subtitle Generation",
      description: "Generates synchronized SRT, VTT, and TXT files instantly. Customize styles and burn them directly into videos.",
      href: "/dashboard/history",
    },
    {
      icon: Zap,
      title: "Real-Time Studio Engine",
      description: "Architected for low latency pipeline processing, preparing the core system for upcoming Live Stream Translation features.",
      href: "/dashboard/upload?mode=text",
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <section id="features" className="py-24 bg-white border-y border-[#F2E8DC]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#D4AF7A]">Capabilities</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-[#2B1B1B] tracking-tight">
            High-Performance Studio Localization
          </p>
          <p className="text-base sm:text-lg text-[#7A6B6B] max-w-2xl mx-auto font-medium">
            VoxBridge AI combines neural speech synthesis, translation algorithms, and lip mapping to give you luxury studio-quality translations in minutes.
          </p>
        </div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group flex flex-col justify-between p-7 rounded-[20px] glass-card border border-[#F2E8DC] hover:border-[#D4AF7A]/60 transition-all duration-300 shadow-soft bg-white"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#FFF8F0] border border-[#D4AF7A]/30 text-[#7B1E3A]">
                    <Icon className="h-6 w-6 text-[#D4AF7A]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#2B1B1B] group-hover:text-[#7B1E3A] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#7A6B6B] font-semibold">
                    {feature.description}
                  </p>
                </div>
                
                <Link
                  href={feature.href}
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#7B1E3A] hover:underline transition-colors group/link"
                >
                  <span>Learn more</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#D4AF7A] transition-transform group-hover/link:translate-x-1" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
