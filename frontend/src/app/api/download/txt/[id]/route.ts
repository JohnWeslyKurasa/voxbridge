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

    const projectName     = project?.name || "Unknown Project";
    const targetLanguage  = project?.targetLanguage || "Unknown";
    const detectedLang    = translation.detectedLanguage || "en";

    // Build formatted text content
    const content = [
      "VoxBridge AI Transcript",
      "=".repeat(50),
      `Project: ${projectName}`,
      `Source Language: ${detectedLang.toUpperCase()}`,
      `Target Language: ${targetLanguage}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "--- ORIGINAL TRANSCRIPT ---",
      translation.transcriptText || "(No transcript available)",
      "",
      `--- TRANSLATED TRANSCRIPT (${targetLanguage}) ---`,
      translation.translatedText || "(No translation available)",
      "",
      "--- TIMESTAMPED SEGMENTS (Original) ---",
      ...(translation.segments || []).map(
        (seg: { start: number; end: number; text: string }) =>
          `[${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`
      ),
      "",
      `--- TIMESTAMPED SEGMENTS (${targetLanguage}) ---`,
      ...(translation.translatedSegments || []).map(
        (seg: { start: number; end: number; text: string }) =>
          `[${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`
      ),
    ].join("\n");

    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="voxbridge_transcript_${projectId}.txt"`,
      },
    });

  } catch (error) {
    console.error("❌ TXT download error:", error);
    return NextResponse.json({ error: "Failed to generate text file." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
