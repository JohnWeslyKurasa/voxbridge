import mongoose, { Schema, Document } from "mongoose";

/**
 * Step status details
 */
export interface IJobStep {
  step: "transcribe" | "translate" | "voice-gen" | "lipsync" | "render";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0 to 100
  error?: string;
}

/**
 * ProcessingJob Interface for TypeScript
 */
export interface IProcessingJob extends Document {
  project: mongoose.Types.ObjectId;
  steps: IJobStep[];
  currentStep: "transcribe" | "translate" | "voice-gen" | "lipsync" | "render";
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ProcessingJob Schema Definition
 * 
 * Why it is needed:
 * - Represents a state machine tracking the status of asynchronous translation tasks.
 * - Helps display granular progress bars on the user dashboard.
 * 
 * Connections:
 * - Links to `Project` model via `project` ObjectId.
 */
const ProcessingJobSchema: Schema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    steps: [
      {
        step: {
          type: String,
          enum: ["transcribe", "translate", "voice-gen", "lipsync", "render"],
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "processing", "completed", "failed"],
          default: "pending",
        },
        progress: {
          type: Number,
          default: 0,
        },
        error: {
          type: String,
          default: "",
        },
      },
    ],
    currentStep: {
      type: String,
      enum: ["transcribe", "translate", "voice-gen", "lipsync", "render"],
      default: "transcribe",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ProcessingJob || mongoose.model<IProcessingJob>("ProcessingJob", ProcessingJobSchema);
