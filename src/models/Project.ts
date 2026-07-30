import mongoose, { Schema, Document } from "mongoose";

/**
 * Project Interface for TypeScript
 *
 * Represents a single user translation job. Each project tracks one
 * media file (audio or video, uploaded or recorded) through the
 * full VoxBridge AI pipeline.
 */
export interface IProject extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  sourceMedia?: mongoose.Types.ObjectId;
  translation?: mongoose.Types.ObjectId;
  status: "idle" | "processing" | "completed" | "failed";
  targetLanguage: string;
  inputType: "upload_audio" | "upload_video" | "microphone"; // How the media was captured
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project Schema Definition
 *
 * Why it is needed:
 * - Acts as the top-level container for a translation job.
 * - Groups the source media file, the translation output, and all status flags.
 *
 * Connections:
 * - Links to `User` model via `owner` ObjectId.
 * - Links to `MediaFile` via `sourceMedia`.
 * - Links to `Translation` via `translation`.
 */
const ProjectSchema: Schema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sourceMedia: {
      type: Schema.Types.ObjectId,
      ref: "MediaFile",
    },
    translation: {
      type: Schema.Types.ObjectId,
      ref: "Translation",
    },
    status: {
      type: String,
      enum: ["idle", "processing", "completed", "failed"],
      default: "idle",
      index: true,
    },
    targetLanguage: {
      type: String,
      required: true,
    },
    // inputType tracks how the user submitted this media
    inputType: {
      type: String,
      enum: ["upload_audio", "upload_video", "microphone", "text"],
      required: true,
      default: "upload_audio"
    },
  },
  { timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
