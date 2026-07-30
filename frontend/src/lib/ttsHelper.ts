import { exec } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import connectToDatabase from "@/lib/mongodb";
import Translation from "@/models/Translation";
import Project from "@/models/Project";

/**
 * Upload a local audio/video file to Cloudinary.
 */
async function uploadToCloudinary(localFilePath: string, publicId: string): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials on server.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  const result = await cloudinary.uploader.upload(localFilePath, {
    resource_type: "video", // Cloudinary uses "video" resource type for audio files too
    public_id: publicId,
    folder: "voxbridge_tts",
    overwrite: true,
  });

  return result.secure_url;
}

/**
 * Run XTTS v2 / Piper TTS Python script as a child process.
 */
function runTTS(
  text: string,
  language: string,
  outputBase: string,
  speakerWav: string = "",
  preserveVoice: boolean = true
): Promise<{ mp3_path: string; engine?: string; voice_cloned?: boolean }> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "python", "tts.py");
    const textFilePath = outputBase + "_input.txt";
    fs.writeFileSync(textFilePath, text, "utf-8");

    const preserveStr = preserveVoice ? "true" : "false";
    const command = `python "${scriptPath}" "@${textFilePath}" "${language}" "${outputBase}" "${speakerWav}" "${preserveStr}"`;

    exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
      if (fs.existsSync(textFilePath)) try { fs.unlinkSync(textFilePath); } catch {}

      if (error && error.killed) {
        return reject(new Error("TTS process timed out after 10 minutes."));
      }
      if (error && error.code !== 0 && !stdout.includes('"success": true')) {
        console.error("❌ TTS execution error:", stderr || error.message);
        return reject(new Error(stderr || error.message));
      }

      try {
        const lines = stdout.trim().split("\n");
        let jsonStr = "";
        for (let i = lines.length - 1; i >= 0; i--) {
          const l = lines[i].trim();
          if (l.startsWith("{") && l.endsWith("}")) {
            jsonStr = l;
            break;
          }
        }
        if (!jsonStr) throw new Error("No JSON line found in script output");
        const result = JSON.parse(jsonStr);
        if (!result.success) return reject(new Error(result.error || "TTS script failed."));
        resolve({
          mp3_path: result.mp3_path,
          engine: result.engine,
          voice_cloned: result.voice_cloned
        });
      } catch (parseErr: unknown) {
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        console.error("❌ TTS stdout parse error:", msg, "Raw stdout:", stdout.slice(0, 300));
        reject(new Error("Invalid response from TTS engine: " + msg));
      }
    });
  });
}

/**
 * Direct TTS processor function with XTTS v2 Voice Cloning support.
 */
export async function processTTS(projectId: string): Promise<{ success: boolean; ttsAudioUrl?: string; engine?: string; error?: string }> {
  try {
    await connectToDatabase();

    const translation = await Translation.findOne({ project: projectId });
    if (!translation) {
      return { success: false, error: "Translation not found for this project." };
    }

    if (!translation.translatedText?.trim()) {
      return { success: false, error: "No translated text available for TTS." };
    }

    const project = await Project.findById(projectId).populate("sourceMedia");
    const targetLanguage = project?.targetLanguage || "English";
    const preserveVoice = translation.voiceSettings?.preserveVoice ?? true;
    const speakerWav = (project?.sourceMedia as any)?.cloudinaryUrl || "";

    translation.ttsStatus = "processing";
    await translation.save();

    let audioUrl = `/api/tts/stream/${projectId}`;
    let engineUsed = "gTTS/Piper";

    // 1. Try remote Python FastAPI backend microservice if deployed (e.g. Render / Railway / AWS)
    const pythonBackendUrl =
      process.env.PYTHON_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL;

    if (pythonBackendUrl) {
      try {
        const cleanBackendUrl = pythonBackendUrl.replace(/\/$/, "");
        console.log(`🌐 Vercel → Forwarding TTS voice cloning request to Python AI microservice: ${cleanBackendUrl}/api/tts`);
        
        const backendRes = await fetch(`${cleanBackendUrl}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: translation.translatedText,
            target_language: targetLanguage,
            speaker_wav: speakerWav,
            preserve_voice: preserveVoice,
          }),
        });

        if (backendRes.ok) {
          const backendData = await backendRes.json();
          if (backendData.success) {
            // Backend now uploads to Cloudinary and returns audio_url (a public HTTPS URL)
            const returnedUrl = backendData.audio_url || backendData.mp3_path;
            if (returnedUrl && returnedUrl.startsWith("http")) {
              // Backend already uploaded to Cloudinary — use the URL directly
              audioUrl = returnedUrl;
              engineUsed = backendData.engine || "XTTS v2 Voice Cloning";
              console.log(`✅ XTTS v2 voice cloning succeeded via Python backend: ${audioUrl}`);
            } else if (returnedUrl && fs.existsSync(returnedUrl)) {
              // Local dev: backend returned local path → upload to Cloudinary here
              audioUrl = await uploadToCloudinary(returnedUrl, `tts_${projectId}`);
              engineUsed = backendData.engine || "XTTS v2 Voice Cloning";
            }
          }
        }
      } catch (backendErr) {
        console.warn("⚠️ Python backend microservice trigger error:", backendErr);
      }
    }

    // 2. If remote microservice not configured or returns proxy stream, run local child_process (for local dev)
    if (audioUrl === `/api/tts/stream/${projectId}`) {
      try {
        const tempBase = path.join(os.tmpdir(), `voxbridge_tts_${projectId}`);
        const ttsRes = await runTTS(translation.translatedText, targetLanguage, tempBase, speakerWav, preserveVoice);
        audioUrl = await uploadToCloudinary(ttsRes.mp3_path, `tts_${projectId}`);
        engineUsed = ttsRes.engine || "XTTS v2 Voice Cloning";
        if (fs.existsSync(ttsRes.mp3_path)) try { fs.unlinkSync(ttsRes.mp3_path); } catch {}
      } catch (localErr) {
        console.warn("⚠️ Local XTTS v2 engine warning (Vercel serverless mode):", localErr);
        audioUrl = `/api/tts/stream/${projectId}`;
      }
    }

    translation.ttsAudioUrl = audioUrl;
    translation.ttsStatus = "completed";
    await translation.save();

    console.log(`🔊 TTS completed successfully for project ${projectId} using ${engineUsed}: ${audioUrl}`);
    return { success: true, ttsAudioUrl: audioUrl, engine: engineUsed };

  } catch (error: unknown) {
    console.warn(`⚠️ Primary processTTS encounter fallback trigger for project ${projectId}:`, error);
    try {
      await connectToDatabase();
      const translation = await Translation.findOne({ project: projectId });
      if (translation) {
        const streamUrl = `/api/tts/stream/${projectId}`;
        translation.ttsAudioUrl = streamUrl;
        translation.ttsStatus = "completed";
        await translation.save();

        return { success: true, ttsAudioUrl: streamUrl };
      }
    } catch (dbErr) {
      console.error("Critical DB update error in processTTS:", dbErr);
    }
    return { success: false, error: "TTS generation process completed with fallback." };
  }
}
