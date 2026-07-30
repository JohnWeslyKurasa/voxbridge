import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Translation from "@/models/Translation";
import User from "@/models/User";
import { processTTS } from "@/lib/ttsHelper";

async function translateTextNode(text: string, targetLang: string): Promise<string> {
  const langCodes: Record<string, string> = {
    English: "en", Hindi: "hi", Spanish: "es", French: "fr", German: "de",
    Italian: "it", Japanese: "ja", Chinese: "zh-CN", Telugu: "te", Tamil: "ta",
    Kannada: "kn", Malayalam: "ml", Bengali: "bn", Marathi: "mr", Gujarati: "gu",
    Punjabi: "pa", Urdu: "ur", Russian: "ru", Arabic: "ar"
  };
  const code = langCodes[targetLang] || "hi";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${code}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        return data[0].map((item: Array<string | number>) => item[0]).join("");
      }
    }
  } catch (err) {
    console.warn("Node translation fallback warning:", err);
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLanguage, targetLanguage, userId } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text content is required." }, { status: 400 });
    }

    const effectiveUserId = userId || "mock-user-johnk";
    const srcLang = sourceLanguage || "English";
    const tgtLang = targetLanguage || "Hindi";

    await connectDB();

    // 1. Locate or create local User profile bridge
    let dbUser = await User.findOne({ clerkId: effectiveUserId });
    if (!dbUser) {
      dbUser = await User.create({
        clerkId: effectiveUserId,
        fullName: "VoxBridge Creator",
        email: `${effectiveUserId}@voxbridge.ai`,
      });
    }

    // 2. Create Project
    const project = await Project.create({
      owner: dbUser._id,
      name: text.length > 30 ? text.substring(0, 30) + "..." : text,
      targetLanguage: tgtLang,
      inputType: "text",
      status: "processing",
    });

    // 3. Perform High-Speed Translation in Node.js
    const translatedText = await translateTextNode(text, tgtLang);

    // Create Translation record with completed text
    const translation = await Translation.create({
      project: project._id,
      transcriptText: text,
      detectedLanguage: srcLang,
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

    // Await TTS generation synchronously for Vercel Serverless environment
    await processTTS(String(project._id)).catch((err) =>
      console.warn("⚠️ TTS generation warning:", err)
    );

    return NextResponse.json({
      success: true,
      projectId: project._id,
      translatedText,
      message: "Text translation completed successfully.",
    });

  } catch (err: unknown) {
    console.error("❌ /api/text-to-voice 500 error:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
