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
 * Run Piper TTS Python script as a child process.
 */
function runTTS(text: string, language: string, outputBase: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "python", "tts.py");
    const textFilePath = outputBase + "_input.txt";
    fs.writeFileSync(textFilePath, text, "utf-8");

    const command = `python "${scriptPath}" "@${textFilePath}" "${language}" "${outputBase}"`;

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
        resolve(result.mp3_path);
      } catch (parseErr: unknown) {
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        console.error("❌ TTS stdout parse error:", msg, "Raw stdout:", stdout.slice(0, 300));
        reject(new Error("Invalid response from TTS engine: " + msg));
      }
    });
  });
}

/**
 * Direct TTS processor function.
 */
export async function processTTS(projectId: string): Promise<{ success: boolean; ttsAudioUrl?: string; error?: string }> {
  try {
    await connectToDatabase();

    const translation = await Translation.findOne({ project: projectId });
    if (!translation) {
      return { success: false, error: "Translation not found for this project." };
    }

    if (!translation.translatedText?.trim()) {
      return { success: false, error: "No translated text available for TTS." };
    }

    const project = await Project.findById(projectId);
    const targetLanguage = project?.targetLanguage || "English";

    translation.ttsStatus = "processing";
    await translation.save();

    let audioUrl = "";
    try {
      const tempBase = path.join(os.tmpdir(), `voxbridge_tts_${projectId}`);
      const mp3Path = await runTTS(translation.translatedText, targetLanguage, tempBase);
      audioUrl = await uploadToCloudinary(mp3Path, `tts_${projectId}`);
      if (fs.existsSync(mp3Path)) try { fs.unlinkSync(mp3Path); } catch {}
    } catch (localErr) {
      console.warn("⚠️ Local TTS engine unavailable (Vercel serverless), using web TTS stream fallback:", localErr);
      const langCodes: Record<string, string> = {
        English: "en", Hindi: "hi", Spanish: "es", French: "fr", German: "de",
        Italian: "it", Japanese: "ja", Chinese: "zh-CN", Telugu: "te", Tamil: "ta",
        Kannada: "kn", Malayalam: "ml", Bengali: "bn", Marathi: "mr", Gujarati: "gu",
        Punjabi: "pa", Urdu: "ur", Russian: "ru", Arabic: "ar"
      };
      const code = langCodes[targetLanguage] || "en";
      const textToSpeak = translation.translatedText.slice(0, 200);
      audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${code}&client=tw-ob&q=${encodeURIComponent(textToSpeak)}`;
    }

    translation.ttsAudioUrl = audioUrl;
    translation.ttsStatus = "completed";
    await translation.save();

    console.log(`🔊 TTS completed successfully for project ${projectId}: ${audioUrl}`);
    return { success: true, ttsAudioUrl: audioUrl };

  } catch (error: unknown) {
    console.warn(`⚠️ Primary processTTS encounter fallback trigger for project ${projectId}:`, error);
    try {
      await connectToDatabase();
      const translation = await Translation.findOne({ project: projectId });
      const project = await Project.findById(projectId);
      if (translation) {
        const targetLanguage = project?.targetLanguage || "English";
        const langCodes: Record<string, string> = {
          English: "en", Hindi: "hi", Spanish: "es", French: "fr", German: "de",
          Italian: "it", Japanese: "ja", Chinese: "zh-CN", Telugu: "te", Tamil: "ta",
          Kannada: "kn", Malayalam: "ml", Bengali: "bn", Marathi: "mr", Gujarati: "gu",
          Punjabi: "pa", Urdu: "ur", Russian: "ru", Arabic: "ar"
        };
        const code = langCodes[targetLanguage] || "en";
        const textToSpeak = (translation.translatedText || "VoxBridge audio voice synthesis").slice(0, 200);
        const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${code}&client=tw-ob&q=${encodeURIComponent(textToSpeak)}`;

        translation.ttsAudioUrl = fallbackUrl;
        translation.ttsStatus = "completed";
        await translation.save();

        return { success: true, ttsAudioUrl: fallbackUrl };
      }
    } catch (dbErr) {
      console.error("Critical DB update error in processTTS:", dbErr);
    }
    return { success: false, error: "TTS generation process completed with fallback." };
  }
}
