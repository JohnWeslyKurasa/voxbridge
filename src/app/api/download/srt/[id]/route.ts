import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Translation from "@/models/Translation";

/**
 * SRT Download API Route — GET /api/download/srt/[id]
 *
 * Why it is needed:
 * - Users need a downloadable .srt subtitle file for their translated video.
 * - SRT format is the universal standard for video subtitles (VLC, YouTube, etc.).
 *
 * How it works:
 * 1. Load the Translation document for the given project ID.
 * 2. Generate SRT content from translatedSegments (with timestamps).
 * 3. Return the content as a text/plain response with Content-Disposition download headers.
 *
 * SRT Format Example:
 *   1
 *   00:00:00,000 --> 00:00:01,460
 *   आह!
 *
 *   2
 *   00:00:01,500 --> 00:00:03,200
 *   Translation text here
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    await connectToDatabase();

    const translation = await Translation.findOne({ project: projectId });
    if (!translation) {
      return NextResponse.json({ error: "Translation not found." }, { status: 404 });
    }

    // Use stored SRT content if already generated, otherwise generate now
    let srtContent = translation.srtContent;

    if (!srtContent && translation.translatedSegments?.length > 0) {
      srtContent = generateSRT(translation.translatedSegments);
      // Cache for future requests
      translation.srtContent = srtContent;
      await translation.save();
    }

    if (!srtContent) {
      return NextResponse.json({ error: "No subtitle data available." }, { status: 404 });
    }

    // Return as downloadable SRT file
    return new Response(srtContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="voxbridge_translated_${projectId}.srt"`,
      },
    });

  } catch (error) {
    console.error("❌ SRT download error:", error);
    return NextResponse.json({ error: "Failed to generate SRT file." }, { status: 500 });
  }
}

/**
 * Converts an array of timestamped segments into SRT subtitle format.
 *
 * SRT timestamp format: HH:MM:SS,mmm --> HH:MM:SS,mmm
 *
 * @param segments Array of {start, end, text} objects (seconds as floats).
 * @returns Full SRT file content as a string.
 */
function generateSRT(
  segments: { start: number; end: number; text: string }[]
): string {
  return segments
    .map((seg, index) => {
      const startTime = secondsToSRTTime(seg.start);
      const endTime   = secondsToSRTTime(seg.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
    })
    .join("\n");
}

/**
 * Converts a float seconds value to SRT timestamp format (HH:MM:SS,mmm).
 *
 * @param totalSeconds Float seconds (e.g. 75.5 → "00:01:15,500").
 */
function secondsToSRTTime(totalSeconds: number): string {
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis  = Math.round((totalSeconds % 1) * 1000);

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":") + "," + String(millis).padStart(3, "0");
}

export const dynamic = "force-dynamic";
