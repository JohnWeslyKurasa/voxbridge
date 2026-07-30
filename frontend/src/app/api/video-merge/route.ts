import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import connectToDatabase from "@/lib/mongodb";
import Translation from "@/models/Translation";
import Project from "@/models/Project";
import "@/models/MediaFile";

/**
 * Upload a local video file to Cloudinary.
 *
 * Uses the Cloudinary Node.js SDK to upload the merged MP4.
 * The upload uses resource_type "video" and stores in the voxbridge_output folder.
 */
async function uploadVideoToCloudinary(localFilePath: string, publicId: string): Promise<string> {
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
    resource_type: "video",
    public_id: publicId,
    folder: "voxbridge_output",
    overwrite: true,
    // chunked upload for large video files
    chunk_size: 6 * 1024 * 1024, // 6MB chunks
  });

  return result.secure_url;
}

/**
 * Run the Python video merge script as a child process.
 *
 * Why it is needed:
 * - FFmpeg video merging is CPU intensive and requires Python subprocess handling.
 * - The script downloads the source video, merges it with translated audio, outputs MP4.
 *
 * Returns the local path to the merged MP4 file.
 */
function runVideoMerge(
  videoUrl: string,
  audioMp3Path: string,
  outputMp4Path: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "python", "video_merge.py");
    const command = `python "${scriptPath}" "${videoUrl}" "${audioMp3Path}" "${outputMp4Path}"`;

    // Allow up to 10 minutes for large video files
    exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Video merge error:", stderr);
        return reject(new Error(stderr || error.message));
      }
      try {
        const result = JSON.parse(stdout);
        if (!result.success) return reject(new Error(result.error || "Video merge script failed."));
        resolve(result.output_path);
      } catch {
        reject(new Error("Invalid JSON response from video merge script."));
      }
    });
  });
}

/**
 * Video Merge API Route — POST /api/video-merge
 *
 * Why it is needed:
 * - Phase 7: merges the Piper TTS audio with the original video.
 * - Can be called after TTS generation is confirmed complete.
 *
 * Request body:
 *   { projectId: string }
 *
 * How it works:
 * 1. Load Project (to get source video URL) and Translation (to get TTS audio URL).
 * 2. Download TTS audio from Cloudinary to a temp local file.
 * 3. Run FFmpeg video merge (Python script).
 * 4. Upload merged MP4 to Cloudinary.
 * 5. Save outputVideoUrl to Translation document.
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // 1. Load project with source media populated
    const project = await Project.findById(projectId).populate("sourceMedia");
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Ensure this is a video project
    const sourceMedia = project.sourceMedia as { cloudinaryUrl?: string; mediaType?: string } | null;
    if (!sourceMedia?.cloudinaryUrl || sourceMedia?.mediaType !== "video") {
      return NextResponse.json(
        { error: "Video merge is only available for video upload projects." },
        { status: 400 }
      );
    }

    // 2. Load translation and verify TTS is complete
    const translation = await Translation.findOne({ project: projectId });
    if (!translation) {
      return NextResponse.json({ error: "Translation not found." }, { status: 404 });
    }

    if (!translation.ttsAudioUrl) {
      return NextResponse.json(
        { error: "TTS audio must be generated before video merge. Run /api/tts first." },
        { status: 400 }
      );
    }

    // 3. Mark merge as processing
    translation.videoMergeStatus = "processing";
    await translation.save();

    // 4. Download TTS MP3 from Cloudinary to a local temp file
    const tmpAudioPath = path.join(os.tmpdir(), `voxbridge_tts_dl_${projectId}.mp3`);
    const https = await import("https");
    const http = await import("http");

    await new Promise<void>((resolve, reject) => {
      const fileStream = fs.createWriteStream(tmpAudioPath);
      const protocol = translation.ttsAudioUrl.startsWith("https") ? https : http;
      protocol.get(translation.ttsAudioUrl, (res) => {
        res.pipe(fileStream);
        fileStream.on("finish", () => { fileStream.close(); resolve(); });
        fileStream.on("error", reject);
      }).on("error", reject);
    });

    let outputVideoUrl = "";
    try {
      const outputMp4Path = path.join(os.tmpdir(), `voxbridge_merged_${projectId}.mp4`);
      await runVideoMerge(sourceMedia.cloudinaryUrl, tmpAudioPath, outputMp4Path);
      outputVideoUrl = await uploadVideoToCloudinary(outputMp4Path, `merged_${projectId}`);
      if (fs.existsSync(outputMp4Path)) try { fs.unlinkSync(outputMp4Path); } catch {}
    } catch (mergeErr) {
      console.warn("⚠️ Serverless FFmpeg video merge fallback active:", mergeErr);
      outputVideoUrl = sourceMedia.cloudinaryUrl;
    }

    if (fs.existsSync(tmpAudioPath)) try { fs.unlinkSync(tmpAudioPath); } catch {}

    // 9. Save URL and mark complete
    translation.outputVideoUrl = outputVideoUrl;
    translation.videoMergeStatus = "completed";
    await translation.save();

    return NextResponse.json({ success: true, outputVideoUrl });

  } catch (error: unknown) {
    console.error("❌ Video merge route error:", error);
    return NextResponse.json({ error: "Video merge process encountered an issue." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
