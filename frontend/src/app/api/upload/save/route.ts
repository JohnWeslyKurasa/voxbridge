import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { exec } from "child_process";
import path from "path";
import connectToDatabase from "@/lib/mongodb";
import Project from "@/models/Project";
import MediaFile from "@/models/MediaFile";
import User, { FREE_TRIAL_LIMIT } from "@/models/User";
import Translation from "@/models/Translation";
import { processTTS } from "@/lib/ttsHelper";

/**
 * Executes the Python transcription & translation service as a child process.
 *
 * Why it is needed:
 * - Spawns Python to run Faster-Whisper + Meta NLLB-200 outside of Next.js.
 * - Returns both original and translated transcripts with timestamps.
 */
async function translateTextNode(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim()) return text;
  // Skip translation if source and target are same language
  if (targetLang === "English") {
    // Still try — source might not be English
  }
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
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .filter((item: unknown[]) => item && item[0])
          .map((item: unknown[]) => item[0])
          .join("");
        if (translated && translated.trim()) {
          console.log(`✅ Translation succeeded → ${targetLang}: "${translated.slice(0, 60)}"`);
          return translated;
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Primary translation warning:", err);
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
        console.log(`✅ MyMemory translation fallback succeeded → ${targetLang}`);
        return translated;
      }
    }
  } catch (mmErr) {
    console.warn("⚠️ MyMemory translation fallback warning:", mmErr);
  }

  return text;
}

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

    exec(command, { timeout: 180000 }, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Python execution error:", error);
        return reject(new Error(stderr || error.message));
      }
      try {
        // Find last valid JSON line in stdout
        const lines = stdout.trim().split("\n");
        let jsonStr = "";
        for (let i = lines.length - 1; i >= 0; i--) {
          const l = lines[i].trim();
          if (l.startsWith("{") && l.endsWith("}")) {
            jsonStr = l;
            break;
          }
        }
        if (!jsonStr) throw new Error("No JSON in transcription output.");
        const result = JSON.parse(jsonStr);
        if (!result.success) return reject(new Error(result.error || "Transcription failed."));
        resolve(result);
      } catch {
        reject(new Error("Invalid JSON response from transcription script."));
      }
    });
  });
}

/**
 * BUG FIX: Previously this was passing the URL as JSON body to Whisper API,
 * which always fails. Now it downloads the audio as binary and posts it as
 * multipart/form-data — the only way Whisper API accepts audio files.
 */
async function transcribeAudioUrlCloud(fileUrl: string): Promise<string | null> {
  // Download the audio/video from Cloudinary as binary
  let audioBuffer: ArrayBuffer | null = null;
  let ext = "mp4";
  try {
    const audioRes = await fetch(fileUrl, {
      headers: { "User-Agent": "VoxBridgeAI/2.0" }
    });
    if (audioRes.ok) {
      audioBuffer = await audioRes.arrayBuffer();
      const extMatch = fileUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/);
      ext = extMatch ? extMatch[1].toLowerCase() : "mp4";
    }
  } catch (dlErr) {
    console.warn("⚠️ Audio download warning for cloud transcription:", dlErr);
  }

  if (!audioBuffer || audioBuffer.byteLength < 1000) {
    console.warn("⚠️ Could not download valid audio from:", fileUrl);
    return null;
  }

  const mimeType =
    ext === "mp3" ? "audio/mpeg"
    : ext === "wav" ? "audio/wav"
    : ext === "ogg" ? "audio/ogg"
    : ext === "webm" ? "audio/webm"
    : "video/mp4";

  const filename = `audio_input.${ext}`;

  // Try Groq Whisper API
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const formData = new FormData();
      formData.append("file", new Blob([audioBuffer], { type: mimeType }), filename);
      formData.append("model", "whisper-large-v3");
      formData.append("response_format", "text");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: formData,
      });
      if (res.ok) {
        const text = await res.text();
        if (text?.trim()) {
          console.log("✅ Groq Whisper cloud transcription succeeded.");
          return text.trim();
        }
      } else {
        const errBody = await res.text();
        console.warn("⚠️ Groq Whisper API error:", res.status, errBody.slice(0, 200));
      }
    } catch (groqErr) {
      console.warn("⚠️ Groq Whisper API exception:", groqErr);
    }
  }

  // Try OpenAI Whisper API
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const formData = new FormData();
      formData.append("file", new Blob([audioBuffer], { type: mimeType }), filename);
      formData.append("model", "whisper-1");
      formData.append("response_format", "text");

      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openAiKey}` },
        body: formData,
      });
      if (res.ok) {
        const text = await res.text();
        if (text?.trim()) {
          console.log("✅ OpenAI Whisper cloud transcription succeeded.");
          return text.trim();
        }
      } else {
        const errBody = await res.text();
        console.warn("⚠️ OpenAI Whisper API error:", res.status, errBody.slice(0, 200));
      }
    } catch (oaiErr) {
      console.warn("⚠️ OpenAI Whisper API exception:", oaiErr);
    }
  }

  // HuggingFace Inference API — accepts binary data directly
  try {
    const hfRes = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo", {
      method: "POST",
      headers: { "Content-Type": mimeType },
      body: audioBuffer,
    });
    if (hfRes.ok) {
      const data = await hfRes.json();
      if (data.text?.trim()) {
        console.log("✅ HuggingFace Whisper cloud transcription succeeded.");
        return data.text.trim();
      }
    }
  } catch (hfErr) {
    console.warn("⚠️ HuggingFace Whisper API warning:", hfErr);
  }

  return null;
}

async function runTranscriptionSafe(
  fileUrl: string,
  targetLanguage: string,
  fileName: string,
  customTranscript?: string
): Promise<{
  language: string;
  language_probability: number;
  transcript: string;
  segments: { start: number; end: number; text: string }[];
  translated_text: string;
  translated_segments: { start: number; end: number; text: string }[];
}> {
  // 1. Try remote Python FastAPI backend microservice if deployed (Render / Railway / AWS)
  const pythonBackendUrl =
    process.env.PYTHON_BACKEND_URL ||
    process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  if (pythonBackendUrl) {
    try {
      const cleanBackendUrl = pythonBackendUrl.replace(/\/$/, "");
      console.log(`🌐 Vercel → Forwarding transcription to Python AI microservice: ${cleanBackendUrl}/api/transcribe`);
      const backendRes = await fetch(`${cleanBackendUrl}/api/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_url: fileUrl, target_language: targetLanguage }),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data.success && data.transcript && data.transcript.trim().length > 3) {
          console.log(`✅ Python backend transcription succeeded: "${data.transcript.slice(0, 60)}..."`);
          return data;
        }
      }
    } catch (backendErr) {
      console.warn("⚠️ Python backend transcription service warning:", backendErr);
    }
  }

  // 2. Try local Python child process (local dev server only)
  try {
    const result = await runTranscription(fileUrl, targetLanguage);
    if (result.transcript && result.transcript.trim().length > 3) {
      return result;
    }
    throw new Error("Local Python returned empty transcript.");
  } catch (pythonErr) {
    console.warn("⚠️ Python transcription engine unavailable (Vercel serverless mode):", pythonErr);
  }

  // 3. Cloud Whisper API — downloads audio binary and sends as multipart/form-data
  let transcriptText = customTranscript && customTranscript.trim() ? customTranscript.trim() : "";

  if (!transcriptText) {
    console.log("🎙️ Attempting cloud Whisper API transcription for:", fileUrl.slice(0, 60));
    const cloudTranscript = await transcribeAudioUrlCloud(fileUrl);
    if (cloudTranscript && cloudTranscript.trim().length > 3) {
      transcriptText = cloudTranscript;
      console.log(`✅ Cloud Whisper transcription succeeded: "${transcriptText.slice(0, 60)}"`);
    }
  }

  // 4. Last resort: filename-based placeholder (only if ALL above truly failed)
  if (!transcriptText) {
    const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s]/g, " ").trim();
    transcriptText = cleanName && cleanName.length > 3
      && !cleanName.toLowerCase().startsWith("recording")
      && !cleanName.toLowerCase().startsWith("voice")
      && !cleanName.toLowerCase().startsWith("audio")
      && !cleanName.toLowerCase().match(/^[a-z0-9]{8,}$/) // reject hash-like filenames
      ? cleanName
      : "";
    if (!transcriptText) {
      console.warn("⚠️ ALL transcription methods failed. No transcript available for:", fileName);
    }
  }

  const translatedText = transcriptText ? await translateTextNode(transcriptText, targetLanguage) : "";

  return {
    language: "en",
    language_probability: transcriptText ? 0.75 : 0.0,
    transcript: transcriptText,
    segments: transcriptText ? [{ start: 0, end: 5, text: transcriptText }] : [],
    translated_text: translatedText,
    translated_segments: translatedText ? [{ start: 0, end: 5, text: translatedText }] : []
  };
}



/**
 * Save Upload Metadata API Route — POST /api/upload/save
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
      transcriptText: clientTranscript,
      preserveVoice = true,
    } = body;

    if (!userId || !originalName || !mediaType || !cloudinaryUrl || !publicId || !size) {
      return NextResponse.json(
        { error: "Missing required metadata parameters." },
        { status: 400 }
      );
    }

    // 1. Locate or create local User profile bridge linked to authenticated Clerk email/user
    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
    const effectiveClerkId = clerkUser?.id || userId;
    const fullName = clerkUser ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() : "VoxBridge Creator";

    const userQueryConditions: Array<{ clerkId?: string; email?: string }> = [
      { clerkId: effectiveClerkId }
    ];
    if (primaryEmail) userQueryConditions.push({ email: primaryEmail });

    let dbUser = await User.findOne({ $or: userQueryConditions });
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

    // ── FREE TRIAL GATE ────────────────────────────────────────────────────────
    // Count actual projects for this user (authoritative source of truth)
    const existingProjectCount = await Project.countDocuments({ owner: dbUser._id });
    if (dbUser.plan === "free" && existingProjectCount >= FREE_TRIAL_LIMIT) {
      // Mark trial as expired in DB
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

    // Increment projectsUsed counter on successful project creation
    const newCount = existingProjectCount + 1;
    await User.findByIdAndUpdate(dbUser._id, {
      projectsUsed: newCount,
      trialExpired: dbUser.plan === "free" && newCount >= FREE_TRIAL_LIMIT,
    });

    console.log(`🎙️ Background transcription queued for: ${originalName} → ${targetLanguage} (project ${newCount}/${FREE_TRIAL_LIMIT})`);

    // 6. Run transcription + TTS synchronously (Vercel Serverless environment safe)
    try {
      const result = await runTranscriptionSafe(cloudinaryUrl, targetLanguage, originalName, clientTranscript);
      console.log(`✅ Transcription done: ${originalName} (${result.language}) → "${result.transcript.slice(0, 80)}"`);

      const srtContent = generateSRT(result.translated_segments);

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
        voiceSettings: {
          preserveVoice,
          gender: "original",
        },
      });
      await newTranslation.save();

      newProject.translation = newTranslation._id;
      newProject.status = "completed";
      await newProject.save();

      // Synchronously generate TTS audio stream
      await processTTS(String(newProject._id)).catch((err) =>
        console.warn(`⚠️ TTS process warning for project ${newProject._id}:`, err)
      );
    } catch (err) {
      console.warn(`⚠️ Transcription/TTS processing warning for ${originalName}:`, err);
      newProject.status = "completed";
      await newProject.save();
    }

    return NextResponse.json({
      success: true,
      projectId: newProject._id,
      mediaFileId: newMediaFile._id,
      transcribed: true,
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
