import { NextResponse } from "next/server";
import { processTTS } from "@/lib/ttsHelper";

/**
 * TTS API Route — POST /api/tts
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const result = await processTTS(projectId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error("❌ TTS route error:", error);
    return NextResponse.json(
      { error: "TTS generation failed." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
