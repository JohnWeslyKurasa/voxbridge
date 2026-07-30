import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary SDK Server Instance Configuration
 * 
 * Why it is needed:
 * - Directs Cloudinary operations (such as generating signed upload signatures, or deleting assets).
 * - Integrates server-side keys securely away from browser exposure.
 * 
 * How it works:
 * - Checks environment credentials.
 * - Instantiates the v2 SDK using `cloudinary.config`.
 */

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // We log a warning instead of throwing during initial build stages to allow setup previewing
  console.warn("⚠️ Cloudinary environment variables are missing. File uploads will fail until configured.");
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME || "placeholder_cloud",
  api_key: CLOUDINARY_API_KEY || "placeholder_key",
  api_secret: CLOUDINARY_API_SECRET || "placeholder_secret",
  secure: true,
});

export default cloudinary;
