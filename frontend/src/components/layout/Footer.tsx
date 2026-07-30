import Link from "next/link";
import { Languages, Github, Twitter, Linkedin } from "lucide-react";

/**
 * Footer Component - Bright Luxury Theme
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: "Audio Translation", href: "#" },
    { name: "Video Translation", href: "#" },
    { name: "Subtitles & Dubbing", href: "#" },
    { name: "Pricing Plans", href: "#pricing" },
  ];

  const companyLinks = [
    { name: "About Us", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Blog & Press", href: "#" },
    { name: "Contact Studio", href: "#" },
  ];

  const legalLinks = [
    { name: "Terms of Service", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Security & Trust", href: "#" },
  ];

  return (
    <footer className="border-t border-[#F2E8DC] bg-white text-[#2B1B1B]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white shadow-sm shadow-[#7B1E3A]/20">
                <Languages className="h-5 w-5 text-[#D4AF7A]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#2B1B1B]">
                VoxBridge<span className="gradient-text">AI</span>
              </span>
            </Link>
            <p className="max-w-xs text-xs font-semibold leading-relaxed text-[#7A6B6B]">
              Breaking global language barriers with luxury AI audio synthesis. Preserve original voice identity, tone, and lip sync seamlessly.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] text-[#7A6B6B] hover:text-[#7B1E3A] hover:border-[#D4AF7A]/50 transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-4 w-4 text-[#D4AF7A]" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] text-[#7A6B6B] hover:text-[#7B1E3A] hover:border-[#D4AF7A]/50 transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="h-4 w-4 text-[#D4AF7A]" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] text-[#7A6B6B] hover:text-[#7B1E3A] hover:border-[#D4AF7A]/50 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-4 w-4 text-[#D4AF7A]" />
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-bold tracking-wider text-[#2B1B1B] uppercase">Product</h3>
              <ul className="mt-4 space-y-3">
                {productLinks.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-xs font-semibold text-[#7A6B6B] hover:text-[#7B1E3A] transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-wider text-[#2B1B1B] uppercase">Company</h3>
              <ul className="mt-4 space-y-3">
                {companyLinks.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-xs font-semibold text-[#7A6B6B] hover:text-[#7B1E3A] transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 mt-8 sm:col-span-1 sm:mt-0">
              <h3 className="text-xs font-bold tracking-wider text-[#2B1B1B] uppercase">Legal</h3>
              <ul className="mt-4 space-y-3">
                {legalLinks.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-xs font-semibold text-[#7A6B6B] hover:text-[#7B1E3A] transition-colors">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-[#F2E8DC] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-[#7A6B6B]">
            &copy; {currentYear} VoxBridge AI Inc. All rights reserved. Built for global voice excellence.
          </p>
          <p className="text-xs font-bold text-[#D4AF7A]">
            Designed with Bright Luxury Studio Aesthetics
          </p>
        </div>
      </div>
    </footer>
  );
}
