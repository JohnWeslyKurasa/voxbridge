import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Translation from "@/models/Translation";
import User, { FREE_TRIAL_LIMIT } from "@/models/User";
import { processTTS } from "@/lib/ttsHelper";

async function translateTextNode(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim()) return text;

  const langCodes: Record<string, string> = {
    English: "en", Hindi: "hi", Spanish: "es", French: "fr", German: "de",
    Italian: "it", Japanese: "ja", Chinese: "zh-CN", Telugu: "te", Tamil: "ta",
    Kannada: "kn", Malayalam: "ml", Bengali: "bn", Marathi: "mr", Gujarati: "gu",
    Punjabi: "pa", Urdu: "ur", Russian: "ru", Arabic: "ar"
  };
  const code = langCodes[targetLang] || "hi";

  // Primary: Google Translate unofficial free endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${code}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .filter((item: unknown[]) => item && item[0])
          .map((item: unknown[]) => item[0])
          .join("");
        if (translated && translated.trim()) {
          console.log(`✅ Text-to-voice translation → ${targetLang}: "${translated.slice(0, 60)}"`);
          return translated;
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Primary translation warning (text-to-voice):", err);
  }

  // Fallback: MyMemory free translation API
  try {
    const mmRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=auto|${code}`,
      { headers: { "User-Agent": "VoxBridgeAI/2.0" } }
    );
    if (mmRes.ok) {
      const mmData = await mmRes.json();
      const translated = mmData?.responseData?.translatedText;
      if (translated && translated.trim() && !translated.toLowerCase().includes("mymemory")) {
        console.log(`✅ MyMemory fallback translation → ${targetLang}`);
        return translated;
      }
    }
  } catch (mmErr) {
    console.warn("⚠️ MyMemory translation fallback warning:", mmErr);
  }

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLanguage, targetLanguage, userId } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text content is required." }, { status: 400 });
    }

    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
    const effectiveClerkId = clerkUser?.id || userId || "guest_user";
    const fullName = clerkUser ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() : "VoxBridge Creator";

    const tgtLang = targetLanguage || "Hindi";

    await connectDB();

    // 1. Locate or create local User profile bridge
    const userQuery: Array<{ clerkId?: string; email?: string }> = [
      { clerkId: effectiveClerkId }
    ];
    if (primaryEmail) userQuery.push({ email: primaryEmail });

    let dbUser = await User.findOne({ $or: userQuery });
    if (!dbUser) {
      dbUser = await User.create({
        clerkId: effectiveClerkId,
        fullName: fullName || "VoxBridge Creator",
        email: primaryEmail || `${effectiveClerkId}@voxbridge.ai`,
        credits: FREE_TRIAL_LIMIT,
        plan: "free",
        projectsUsed: 0,
        trialExpired: false,
      });
    }

    // ── FREE TRIAL GATE ──────────────────────────────────────────────────────
    const existingProjectCount = await Project.countDocuments({ owner: dbUser._id });
    if (dbUser.plan === "free" && existingProjectCount >= FREE_TRIAL_LIMIT) {
      await User.findByIdAndUpdate(dbUser._id, { trialExpired: true, projectsUsed: existingProjectCount });
      return NextResponse.json(
        {
          error: "free_trial_expired",
          message: `Your free trial has ended. You've used all ${FREE_TRIAL_LIMIT} free projects. Upgrade to Pro to continue creating unlimited translations.`,
          projectsUsed: existingProjectCount,
          trialLimit: FREE_TRIAL_LIMIT,
        },
        { status: 403 }
      );
    }

    // 2. Create Project
    const project = await Project.create({
      owner: dbUser._id,
      name: text.length > 30 ? text.substring(0, 30) + "..." : text,
      targetLanguage: tgtLang,
      inputType: "text",
      status: "processing",
    });

    // 3. Perform High-Quality Translation
    const translatedText = await translateTextNode(text, tgtLang);

    // 4. Create Translation record
    const translation = await Translation.create({
      project: project._id,
      transcriptText: text,
      detectedLanguage: sourceLanguage || "English",
      translatedText,
      segments: [{ start: 0, end: 0, text }],
      translatedSegments: [{ start: 0, end: 0, text: translatedText }],
      ttsStatus: "processing",
    });

    // Link Translation back to Project and set completed status
    await Project.findByIdAndUpdate(project._id, {
      translation: translation._id,
      status: "completed"
    });

    // Increment projectsUsed counter
    const newCount = existingProjectCount + 1;
    await User.findByIdAndUpdate(dbUser._id, {
      projectsUsed: newCount,
      trialExpired: dbUser.plan === "free" && newCount >= FREE_TRIAL_LIMIT,
    });

    // 5. Generate TTS audio
    await processTTS(String(project._id)).catch((err) =>
      console.warn("⚠️ TTS generation warning:", err)
    );

    return NextResponse.json({
      success: true,
      projectId: project._id,
      translatedText,
      projectsUsed: newCount,
      projectsRemaining: Math.max(0, FREE_TRIAL_LIMIT - newCount),
      message: "Text translation completed successfully.",
    });

  } catch (err: unknown) {
    console.error("❌ /api/text-to-voice 500 error:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
