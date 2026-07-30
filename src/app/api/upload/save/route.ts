import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import connectToDatabase from "@/lib/mongodb";
import Project from "@/models/Project";
import MediaFile from "@/models/MediaFile";
import User from "@/models/User";
import Translation from "@/models/Translation";
import { processTTS } from "@/lib/ttsHelper";

/**
 * Executes the Python transcription & translation service as a child process.
 *
 * Why it is needed:
 * - Spawns Python to run Faster-Whisper + Meta NLLB-200 outside of Next.js.
 * - Returns both original and translated transcripts with timestamps.
 */
function runTranscription(
  fileUrl: string,
  targetLanguage: string
): Promise<{
  language: string;
  language_probability: number;
  transcript: string;
  segments: { start: number; end: number; text: string }[];
  translated_text: string;
  translated_segments: { start: number; end: number; text: string }[];
}> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "python", "transcribe.py");
    const command = `python "${scriptPath}" "${fileUrl}" "${targetLanguage}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Python execution error:", error);
        return reject(new Error(stderr || error.message));
      }
      try {
        const result = JSON.parse(stdout);
        if (!result.success) return reject(new Error(result.error || "Transcription failed."));
        resolve(result);
      } catch {
        reject(new Error("Invalid JSON response from transcription script."));
      }
    });
  });
}



/**
 * Save Upload Metadata API Route — POST /api/upload/save
 *
 * Why it is needed:
 * - Persists Cloudinary asset URLs, durations, and original file sizes to MongoDB Atlas.
 * - Spawns background Python transcription + translation.
 * - After transcription completes, automatically queues TTS generation.
 *
 * How it works:
 * 1. Connect to MongoDB.
 * 2. Find or create User profile.
 * 3. Create Project and MediaFile records.
 * 4. Return immediate HTTP success (non-blocking).
 * 5. In background: run transcription → save results → queue TTS → (for video) queue merge.
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      userId,
      originalName,
      mediaType,
      cloudinaryUrl,
      publicId,
      size,
      duration = 0,
      targetLanguage = "Hindi",
      inputType = "upload_audio",
    } = body;

    if (!userId || !originalName || !mediaType || !cloudinaryUrl || !publicId || !size) {
      return NextResponse.json(
        { error: "Missing required metadata parameters." },
        { status: 400 }
      );
    }

    // 1. Locate or create local User profile bridge
    let dbUser = await User.findOne({ clerkId: userId });
    if (!dbUser) {
      dbUser = await User.create({
        clerkId: userId,
        fullName: "VoxBridge Creator",
        email: `${userId}@clerk.preview`,
        credits: 15,
        plan: "free",
      });
    }

    // 2. Determine input type from mediaType if not explicitly provided
    const resolvedInputType =
      inputType === "microphone"
        ? "microphone"
        : mediaType === "video"
        ? "upload_video"
        : "upload_audio";

    // 3. Create the new Project document (status: processing)
    const newProject = new Project({
      owner: dbUser._id,
      name: originalName,
      status: "processing",
      targetLanguage,
      inputType: resolvedInputType,
    });
    await newProject.save();

    // 4. Create the MediaFile document
    const newMediaFile = new MediaFile({
      userId,
      projectId: newProject._id,
      originalName,
      mediaType,
      cloudinaryUrl,
      publicId,
      size,
      duration,
    });
    await newMediaFile.save();

    // Link Project → MediaFile
    newProject.sourceMedia = newMediaFile._id;
    await newProject.save();

    console.log(`🎙️ Background transcription queued for: ${originalName} → ${targetLanguage}`);

    // 6. Run transcription + TTS in background (non-blocking)
    runTranscription(cloudinaryUrl, targetLanguage)
      .then(async (result) => {
        console.log(`✅ Transcription done: ${originalName} (${result.language})`);

        // Build SRT content from translated segments
        const srtContent = generateSRT(result.translated_segments);

        // Save Translation document
        const newTranslation = new Translation({
          project: newProject._id,
          transcriptText: result.transcript,
          detectedLanguage: result.language,
          translatedText: result.translated_text,
          segments: result.segments,
          translatedSegments: result.translated_segments,
          srtContent,
          ttsStatus: "pending",
          videoMergeStatus: resolvedInputType === "upload_video" ? "pending" : "skipped",
        });
        await newTranslation.save();

        // Link Translation → Project
        newProject.translation = newTranslation._id;
        newProject.status = "completed";
        await newProject.save();

        // 7. Auto-queue TTS generation (direct background execution)
        processTTS(String(newProject._id)).catch((err) =>
          console.error(`⚠️ TTS process failed for project ${newProject._id}:`, err)
        );
      })
      .catch(async (err) => {
        console.error(`⚠️ Transcription failed for ${originalName}:`, err);
        newProject.status = "failed";
        await newProject.save();
      });

    // Return immediately — transcription runs in background
    return NextResponse.json({
      success: true,
      projectId: newProject._id,
      mediaFileId: newMediaFile._id,
      transcribed: false, // Processing in background
    });

  } catch (error: unknown) {
    console.error("❌ Error saving upload metadata:", error);
    return NextResponse.json(
      { error: "Failed to persist file details to database." },
      { status: 500 }
    );
  }
}

/**
 * Generates SRT subtitle content from an array of timestamped segments.
 * Stored in the Translation document for instant download without re-generation.
 */
function generateSRT(segments: { start: number; end: number; text: string }[]): string {
  return segments
    .map((seg, index) => {
      return `${index + 1}\n${toSRTTime(seg.start)} --> ${toSRTTime(seg.end)}\n${seg.text}\n`;
    })
    .join("\n");
}

function toSRTTime(seconds: number): string {
  const h  = Math.floor(seconds / 3600);
  const m  = Math.floor((seconds % 3600) / 60);
  const s  = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms).padStart(3,"0")}`;
}
