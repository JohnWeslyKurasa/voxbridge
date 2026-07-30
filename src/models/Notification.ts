import mongoose, { Schema, Document } from "mongoose";

/**
 * Notification Interface for TypeScript
 */
export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link?: string;
  createdAt: Date;
}

/**
 * Notification Schema Definition
 * 
 * Why it is needed:
 * - Directs operational notifications (e.g. project completed, payment success) to the user.
 * - Underpins the notifications drop-down in the dashboard top navbar.
 * 
 * Connections:
 * - Links to `User` model via `recipient` ObjectId.
 */
const NotificationSchema: Schema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
