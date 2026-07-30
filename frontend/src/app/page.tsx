import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/layout/Footer";

/**
 * Root Landing Page
 * 
 * Why it is needed:
 * - The primary entry point for VoxBridge AI SaaS application.
 * - Outlines value propositions, detailed features, FAQ, and action links.
 * 
 * How it works:
 * - Aggregates layout shells and specific landing sections.
 * - Structured cleanly using standard grid/flex flows to ensure perfect responsiveness.
 */
export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-brand-bg antialiased">
      {/* Navigation Header */}
      <Navbar />

      {/* Page Body Contents */}
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FAQSection />
      </main>

      {/* Footer Branding Links */}
      <Footer />
    </div>
  );
}
