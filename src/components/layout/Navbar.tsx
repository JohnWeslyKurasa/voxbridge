"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Languages, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Navbar Component - Bright Luxury Theme
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-[#F2E8DC] bg-[#FFF8F0]/90 backdrop-blur-md shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white shadow-md shadow-[#7B1E3A]/20 group-hover:scale-105 transition-transform duration-200">
              <Languages className="h-5 w-5 text-[#D4AF7A]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#2B1B1B]">
                VoxBridge<span className="gradient-text">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-[#D4AF7A] tracking-wider uppercase -mt-1">
                Luxury Voice Studio
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-semibold text-[#7A6B6B] hover:text-[#7B1E3A] transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Authentication Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-[#7A6B6B] hover:text-[#7B1E3A] transition-colors duration-200 px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#7B1E3A]/20 hover:shadow-lg hover:shadow-[#7B1E3A]/30 transition-all duration-200 active:scale-95 border border-[#D4AF7A]/30"
            >
              <Sparkles className="h-4 w-4 text-[#D4AF7A]" />
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-xl p-2 text-[#7A6B6B] hover:bg-[#F8EFE6] focus:outline-none transition-colors"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden border-b border-[#F2E8DC] bg-[#FFF8F0]/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="space-y-1 px-4 pb-6 pt-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-[#2B1B1B] hover:bg-[#F8EFE6] hover:text-[#7B1E3A] transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <hr className="my-3 border-[#F2E8DC]" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-[#F2E8DC] bg-white px-4 py-3 text-sm font-bold text-[#2B1B1B] hover:bg-[#F8EFE6] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7B1E3A] to-[#A23B5A] px-4 py-3 text-sm font-bold text-white shadow-md transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-[#D4AF7A]" />
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
