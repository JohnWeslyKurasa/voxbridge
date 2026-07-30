import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Translation from "@/models/Translation";
import Project from "@/models/Project";

/**
 * TTS Audio Streaming Proxy Route — GET /api/tts/stream/[id]
 *
 * Why it is needed:
 * - Direct requests from HTML5 <audio> elements to third-party speech endpoints are blocked by CORS/403 errors.
 * - This route fetches the synthesized audio server-side with appropriate headers and streams clean MP3 audio to the browser.
 */
async function generateVoiceClonedSpeech(text: string): Promise<ArrayBuffer | null> {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: "nova",
        }),
      });
      if (res.ok) {
        return await res.arrayBuffer();
      }
    } catch (err) {
      console.warn("OpenAI TTS voice matching warning:", err);
    }
  }

  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    try {
      const voiceId = "21m00Tcm4TlvDq8ikWAM";
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
        }),
      });
      if (res.ok) {
        return await res.arrayBuffer();
      }
    } catch (err) {
      console.warn("ElevenLabs Voice Cloning warning:", err);
    }
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
      Project.findById(projectId),
      Translation.findOne({ project: projectId }),
    ]);

    if (!translation || !translation.translatedText) {
      return NextResponse.json({ error: "Translation text not available for TTS audio." }, { status: 404 });
    }

    const targetLanguage = project?.targetLanguage || "Hindi";
    const langCodes: Record<string, string> = {
      English: "en", Hindi: "hi", Spanish: "es", French: "fr", German: "de",
      Italian: "it", Japanese: "ja", Chinese: "zh-CN", Telugu: "te", Tamil: "ta",
      Kannada: "kn", Malayalam: "ml", Bengali: "bn", Marathi: "mr", Gujarati: "gu",
      Punjabi: "pa", Urdu: "ur", Russian: "ru", Arabic: "ar"
    };
    const code = langCodes[targetLanguage] || "hi";

    // Clean text to speak up to 300 characters
    const cleanText = translation.translatedText.replace(/[\r\n]+/g, " ").trim().slice(0, 300);

    // If Cloudinary MP3 exists and starts with https://res.cloudinary.com, stream it
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

    // Try Cloud Voice-Cloning synthesis engine
    const voiceClonedBuffer = await generateVoiceClonedSpeech(cleanText);
    if (voiceClonedBuffer) {
      return new Response(voiceClonedBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(voiceClonedBuffer.byteLength),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Server-side fetch from Google Translate TTS engine with User-Agent header
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${code}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
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
