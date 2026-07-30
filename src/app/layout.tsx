import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "VoxBridge AI - Premium Audio & Video Translation Platform",
  description: "Translate audio and video files while preserving original voice tone, style, emotion, and accent with seamless lip sync.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        className={`${plusJakartaSans.variable} font-sans h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#FFF8F0] text-[#2B1B1B]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
