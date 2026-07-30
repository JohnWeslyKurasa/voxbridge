import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Translation from "@/models/Translation";
import Project from "@/models/Project";

/**
 * TTS Audio Streaming Proxy Route — GET /api/tts/stream/[id]
 *
 * Priority order:
 * 1. If ttsAudioUrl is a Cloudinary URL → stream directly (XTTS v2 was already run).
 * 2. If PYTHON_BACKEND_URL is configured → forward to Python AI microservice with speaker_wav
 *    (XTTS v2 voice cloning using the original uploaded audio as reference).
 * 3. ElevenLabs voice-to-voice cloning using reference audio URL (if API key available).
 * 4. OpenAI TTS with speaker voice matching (if API key available).
 * 5. Google Translate TTS (pure fallback, no voice clone).
 */

async function streamFromPythonBackend(
  text: string,
  targetLanguage: string,
  speakerWav: string,
  backendUrl: string
): Promise<ArrayBuffer | null> {
  try {
    const cleanUrl = backendUrl.replace(/\/$/, "");
    console.log(`🌐 Forwarding XTTS v2 voice clone request to: ${cleanUrl}/api/tts`);
    const res = await fetch(`${cleanUrl}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        target_language: targetLanguage,
        speaker_wav: speakerWav,
        preserve_voice: true,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`⚠️ Python backend TTS error ${res.status}:`, err.slice(0, 200));
      return null;
    }
    const data = await res.json();
    // Backend returns a Cloudinary URL or local path
    const audioPath = data.audio_url || data.mp3_path;
    if (audioPath && audioPath.startsWith("http")) {
      const audioRes = await fetch(audioPath);
      if (audioRes.ok) return audioRes.arrayBuffer();
    }
  } catch (err) {
    console.warn("⚠️ Python backend stream error:", err);
  }
  return null;
}

async function streamWithElevenLabs(
  text: string,
  speakerAudioUrl: string
): Promise<ArrayBuffer | null> {
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenKey) return null;

  try {
    // Step 1: Create an instant voice clone from the reference audio URL
    const audioRes = await fetch(speakerAudioUrl, {
      headers: { "User-Agent": "VoxBridgeAI/2.0" }
    });
    if (!audioRes.ok) return null;
    const audioBuffer = await audioRes.arrayBuffer();

    const extMatch = speakerAudioUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "mp4";
    const mimeType = ext === "mp3" ? "audio/mpeg" : ext === "wav" ? "audio/wav" : "video/mp4";

    // Create temporary instant voice clone
    const cloneForm = new FormData();
    cloneForm.append("files", new Blob([audioBuffer], { type: mimeType }), `speaker.${ext}`);
    cloneForm.append("name", "voxbridge_voice_clone");
    cloneForm.append("description", "VoxBridge AI instant voice clone");

    const cloneRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": elevenKey },
      body: cloneForm,
    });
    if (!cloneRes.ok) {
      console.warn("⚠️ ElevenLabs voice clone creation failed:", cloneRes.status);
      return null;
    }
    const cloneData = await cloneRes.json();
    const voiceId = cloneData.voice_id;
    if (!voiceId) return null;

    // Step 2: Generate speech with the cloned voice
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.85 },
      }),
    });

    // Cleanup: delete temporary cloned voice
    fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: "DELETE",
      headers: { "xi-api-key": elevenKey },
    }).catch(() => {});

    if (ttsRes.ok) {
      return ttsRes.arrayBuffer();
    }
  } catch (err) {
    console.warn("⚠️ ElevenLabs voice cloning warning:", err);
  }
  return null;
}

async function streamWithOpenAI(text: string): Promise<ArrayBuffer | null> {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1-hd",
        input: text,
        voice: "onyx",
      }),
    });
    if (res.ok) return res.arrayBuffer();
  } catch (err) {
    console.warn("⚠️ OpenAI TTS warning:", err);
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    await connectToDatabase();

    const [project, translation] = await Promise.all([
      Project.findById(projectId).populate("sourceMedia"),
      Translation.findOne({ project: projectId }),
    ]);

    if (!translation || !translation.translatedText) {
      return NextResponse.json({ error: "Translation text not available for TTS audio." }, { status: 404 });
    }

    const targetLanguage = project?.targetLanguage || "Hindi";
    const speakerWavUrl: string = (project?.sourceMedia as any)?.cloudinaryUrl || "";

    // Clean text to speak (up to 500 characters for better coverage)
    const cleanText = translation.translatedText.replace(/[\r\n]+/g, " ").trim().slice(0, 500);

    // ─── Priority 1: ttsAudioUrl is already a Cloudinary XTTS v2 URL ─────────
    if (translation.ttsAudioUrl && translation.ttsAudioUrl.includes("cloudinary.com")) {
      const cloudRes = await fetch(translation.ttsAudioUrl);
      if (cloudRes.ok) {
        const audioBuffer = await cloudRes.arrayBuffer();
        return new Response(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    // ─── Priority 2: Python AI Microservice with XTTS v2 voice cloning ────────
    const pythonBackendUrl =
      process.env.PYTHON_BACKEND_URL ||
      process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL;

    if (pythonBackendUrl && speakerWavUrl) {
      const xttsBuffer = await streamFromPythonBackend(cleanText, targetLanguage, speakerWavUrl, pythonBackendUrl);
      if (xttsBuffer) {
        return new Response(xttsBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": String(xttsBuffer.byteLength),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    // ─── Priority 3: ElevenLabs instant voice cloning ─────────────────────────
    if (speakerWavUrl) {
      const elevenBuffer = await streamWithElevenLabs(cleanText, speakerWavUrl);
      if (elevenBuffer) {
        return new Response(elevenBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": String(elevenBuffer.byteLength),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    // ─── Priority 4: OpenAI TTS (no voice clone, quality TTS) ─────────────────
    const openAiBuffer = await streamWithOpenAI(cleanText);
    if (openAiBuffer) {
      return new Response(openAiBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(openAiBuffer.byteLength),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // ─── Priority 5: Google Translate TTS (pure fallback) ─────────────────────
    const langCodes: Record<string, string> = {
      English: "en", Hindi: "hi", Spanish: "es", French: "fr", German: "de",
      Italian: "it", Japanese: "ja", Chinese: "zh-CN", Telugu: "te", Tamil: "ta",
      Kannada: "kn", Malayalam: "ml", Bengali: "bn", Marathi: "mr", Gujarati: "gu",
      Punjabi: "pa", Urdu: "ur", Russian: "ru", Arabic: "ar"
    };
    const code = langCodes[targetLanguage] || "hi";
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${code}&client=tw-ob&q=${encodeURIComponent(cleanText.slice(0, 200))}`;
    const googleRes = await fetch(googleTtsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
      },
    });

    if (!googleRes.ok) {
      throw new Error(`Google TTS stream returned HTTP ${googleRes.status}`);
    }

    const audioBuffer = await googleRes.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to stream TTS audio";
    console.error("❌ TTS stream route error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
