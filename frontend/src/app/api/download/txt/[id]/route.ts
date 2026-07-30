import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Translation from "@/models/Translation";
import Project from "@/models/Project";

/**
 * Text Transcript Download API Route — GET /api/download/txt/[id]
 *
 * Why it is needed:
 * - Users want to download their transcripts as plain text files for offline use,
 *   sharing, or feeding into other tools.
 *
 * How it works:
 * 1. Load Project (for name and language info) and Translation document.
 * 2. Format both the original and translated transcripts into a readable .txt file.
 * 3. Return as a Content-Disposition attachment response.
 *
 * Output Format:
 *   VoxBridge AI Transcript
 *   =======================
 *   Project: filename.mp4
 *   Source Language: en
 *   Target Language: Hindi
 *
 *   --- ORIGINAL TRANSCRIPT ---
 *   <original text>
 *
 *   --- TRANSLATED TRANSCRIPT (Hindi) ---
 *   <translated text>
 */
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
    console.warn("Node translation download fallback warning:", err);
  }
  return text;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    await connectToDatabase();

    const [project, translation] = await Promise.all([
      Project.findById(projectId),
      Translation.findOne({ project: projectId }),
    ]);

    if (!translation) {
      return NextResponse.json({ error: "Translation not found." }, { status: 404 });
    }

    const projectName     = project?.name || "VoxBridge Project";
    const targetLanguage  = project?.targetLanguage || "Hindi";
    const detectedLang    = translation.detectedLanguage || "en";

    let translatedText = translation.translatedText;
    if (!translatedText || !translatedText.trim()) {
      translatedText = await translateTextNode(translation.transcriptText || projectName, targetLanguage);
      translation.translatedText = translatedText;
      await translation.save();
    }

    // Build formatted text content focused on target language translation
    const content = [
      `VoxBridge AI — ${targetLanguage} Translated Transcript`,
      "=".repeat(60),
      `Project: ${projectName}`,
      `Source Language: ${detectedLang.toUpperCase()}`,
      `Target Language: ${targetLanguage}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `=== TRANSLATED TEXT (${targetLanguage}) ===`,
      translatedText,
      "",
      `=== ORIGINAL TRANSCRIPT ===`,
      translation.transcriptText || "(No transcript available)",
      "",
      `=== TIMESTAMPED SEGMENTS (${targetLanguage}) ===`,
      ...(translation.translatedSegments && translation.translatedSegments.length > 0
        ? translation.translatedSegments.map(
            (seg: { start: number; end: number; text: string }) =>
              `[${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`
          )
        : [`[0.00s - 5.00s] ${translatedText}`]),
    ].join("\n");

    const safeFilename = encodeURIComponent(projectName.replace(/[^a-zA-Z0-9_-]/g, "_"));

    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeFilename}_${targetLanguage}.txt"`,
      },
    });

  } catch (error) {
    console.error("❌ TXT download error:", error);
    return NextResponse.json({ error: "Failed to generate text file." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
