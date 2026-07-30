import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Translation from "@/models/Translation";
import User from "@/models/User";
import { processTTS } from "@/lib/ttsHelper";

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

    // Create Translation record
    const translation = await Translation.create({
      project: project._id,
      transcriptText: text,
      detectedLanguage: srcLang,
      translatedText: "",
      segments: [{ start: 0, end: 0, text }],
      translatedSegments: [],
      ttsStatus: "pending",
    });

    // Link Translation back to Project
    await Project.findByIdAndUpdate(project._id, { translation: translation._id });

    // Trigger Python translation script in background or synchronously
    const scriptPath = path.join(process.cwd(), "python", "translate_text.py");
    const tempDir = path.join(process.cwd(), "scratch");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const inputFilePath = path.join(tempDir, `text_in_${project._id}.txt`);
    fs.writeFileSync(inputFilePath, text, "utf-8");

    const command = `python "${scriptPath}" "@${inputFilePath}" "${srcLang}" "${tgtLang}"`;

    exec(command, { timeout: 300000 }, async (error, stdout, stderr) => {
      if (fs.existsSync(inputFilePath)) {
        try { fs.unlinkSync(inputFilePath); } catch {}
      }

      if (error || (stderr && stderr.includes("Traceback"))) {
        console.error("❌ Text translation script error:", stderr || error?.message);
        await Project.findByIdAndUpdate(project._id, { status: "failed" });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (!result.success) {
          await Project.findByIdAndUpdate(project._id, { status: "failed" });
          return;
        }

        const translatedText = result.translatedText;

        // Update Translation and Project in DB
        await Translation.findByIdAndUpdate(translation._id, {
          translatedText,
          translatedSegments: [{ start: 0, end: 0, text: translatedText }],
          ttsStatus: "processing",
        });

        await Project.findByIdAndUpdate(project._id, { status: "completed" });

        // Trigger TTS generation directly in Node.js
        processTTS(String(project._id)).catch((err) =>
          console.error("❌ Failed to process TTS after text translation:", err)
        );

      } catch (parseErr) {
        console.error("❌ Error parsing translation output:", parseErr);
        await Project.findByIdAndUpdate(project._id, { status: "failed" });
      }
    });

    return NextResponse.json({
      success: true,
      projectId: project._id,
      message: "Text translation job started successfully.",
    });

  } catch (err: unknown) {
    console.error("❌ /api/text-to-voice 500 error:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
