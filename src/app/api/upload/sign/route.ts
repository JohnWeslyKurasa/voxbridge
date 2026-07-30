import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

/**
 * Cloudinary Signature API Endpoint
 * 
 * Why it is needed:
 * - Direct signed uploading from the browser is required to bypass serverless payload limits.
 * - This endpoint securely signs the upload parameters on the server using our API secret
 *   so the browser can upload files directly to Cloudinary without exposing our secret key.
 * 
 * How it works:
 * - Reads a POST request, verifying the upload requirements (e.g. folder name).
 * - Computes a SHA-1 signature using Cloudinary's SDK helper.
 * - Returns signature, timestamp, and API keys to the client.
 * 
 * Connections:
 * - Called by `upload.service.ts` right before starting a file transfer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { folder = "voxbridge_uploads" } = body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Define the parameters we want to sign
    const paramsToSign = {
      timestamp,
      folder,
    };

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary is not configured. Missing API secret on the server." },
        { status: 500 }
      );
    }

    // Generate signed token
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
    });
  } catch (error: unknown) {
    console.error("❌ Error generating Cloudinary signature:", error);
    return NextResponse.json(
      { error: "Failed to generate upload parameters signature." },
      { status: 500 }
    );
  }
}
