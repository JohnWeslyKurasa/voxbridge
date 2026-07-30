"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { User, Shield, CreditCard, Sparkles, LogOut, CheckCircle2 } from "lucide-react";

/**
 * ProfilePage — /dashboard/profile (Bright Luxury Theme)
 */
export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B1B1B] tracking-tight flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center shadow-sm">
            <User className="h-5 w-5 text-[#D4AF7A]" />
          </div>
          User Profile & Subscription
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6B6B] font-semibold mt-1">
          Manage your account credentials, view plan credits, and review usage tiers.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-[20px] border border-[#F2E8DC] p-6 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user?.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.imageUrl}
              alt={user.fullName || "User Avatar"}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-[#D4AF7A]/40 shadow-md"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#7B1E3A] to-[#A23B5A] text-white flex items-center justify-center font-extrabold text-2xl shadow-md border border-[#D4AF7A]/40">
              {user?.firstName?.[0] || "U"}
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-[#2B1B1B]">
              {user?.fullName || "VoxBridge AI Creator"}
            </h2>
            <p className="text-xs text-[#7A6B6B] font-semibold">
              {user?.primaryEmailAddress?.emailAddress || "johnk@voxbridge.ai"}
            </p>
            <span className="inline-flex items-center gap-1.5 bg-[#FFF8F0] text-[#7B1E3A] border border-[#D4AF7A]/40 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Shield className="h-3 w-3 text-[#D4AF7A]" />
              Authenticated via Clerk
            </span>
          </div>
        </div>

        <SignOutButton>
          <button className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </SignOutButton>
      </div>

      {/* Plan & Credits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-[20px] border border-[#F2E8DC] p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#F2E8DC] pb-3">
            <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-[#7B1E3A]" />
            </div>
            <h3 className="text-sm font-bold text-[#2B1B1B]">Subscription Plan</h3>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7A6B6B]">Current Tier</span>
              <span className="text-xs font-extrabold text-[#7B1E3A] bg-[#FFF8F0] border border-[#D4AF7A]/40 px-3 py-1 rounded-full uppercase tracking-wider">
                Pro Studio Tier
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#7A6B6B]">Monthly AI Credits</span>
                <span className="text-[#2B1B1B]">15 / 15 Used</span>
              </div>
              <div className="h-2.5 w-full bg-[#FFF8F0] border border-[#F2E8DC] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#7B1E3A] to-[#D4AF7A] w-full rounded-full" />
              </div>
            </div>

            <p className="text-[11px] text-[#7A6B6B] font-semibold leading-relaxed">
              Unlimited processing using offline Faster-Whisper, Meta NLLB-200, and Piper TTS engines.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-[#F2E8DC] p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#F2E8DC] pb-3">
            <div className="h-8 w-8 rounded-xl bg-[#FFF8F0] border border-[#F2E8DC] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#D4AF7A]" />
            </div>
            <h3 className="text-sm font-bold text-[#2B1B1B]">Features Unlocked</h3>
          </div>

          <ul className="space-y-2.5 text-xs font-bold text-[#2B1B1B]">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              Faster-Whisper INT8 Speech-to-Text
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              Meta NLLB-200 Multilingual Translation (13+ Indian languages)
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              Piper Offline Text-to-Speech Engine
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              FFmpeg Synchronized Video Lip Syncing
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
