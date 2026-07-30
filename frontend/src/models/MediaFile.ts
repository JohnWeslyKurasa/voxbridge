import mongoose, { Schema, Document } from "mongoose";

/**
 * MediaFile Interface for TypeScript
 */
export interface IMediaFile extends Document {
  userId: string; // Clerk User ID string
  projectId: mongoose.Types.ObjectId; // Relational link to the Project
  originalName: string; // Uploaded filename (e.g. interview.mp4)
  mediaType: "audio" | "video"; // Format type
  cloudinaryUrl: string; // Secure Cloudinary URL
  publicId: string; // Cloudinary asset ID for remote management
  size: number; // File size in bytes
  duration: number; // Duration in seconds
  createdAt: Date;
}

/**
 * MediaFile Schema Definition
 * 
 * Why it is needed:
 * - Stores files metadata and Cloudinary URLs linked to specific projects and users.
 * - Key durational attributes are cached here to calculate SaaS usage billing/credits.
 * 
 * How it works:
 * - Uses mongoose references and indexes on projectId and userId to query project assets fast.
 */
const MediaFileSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

// Prevent compiling model multiple times on hot reloads
export default mongoose.models.MediaFile || mongoose.model<IMediaFile>("MediaFile", MediaFileSchema);
