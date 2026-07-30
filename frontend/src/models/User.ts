import mongoose, { Schema, Document } from "mongoose";

/**
 * User Interface for TypeScript
 */
export interface IUser extends Document {
  clerkId: string;
  fullName: string;
  email: string;
  profileImage?: string;
  plan: "free" | "pro" | "enterprise";
  credits: number;
  createdAt: Date;
}

/**
 * User Schema Definition
 * 
 * Why it is needed:
 * - Tracks user identity, payment/subscription status, and credit balance.
 * - Bridges Clerk authentication accounts to local operational metadata (like credit counts).
 * 
 * How it works:
 * - Stores Clerk User ID as a unique identifier to query user details fast.
 * - Includes index triggers on clerkId and email to optimize database searches.
 * - Prevents OverwriteModelError during hot reloading by checking `mongoose.models.User`.
 */
const UserSchema: Schema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    credits: {
      type: Number,
      default: 15, // Free tier credits allocation
    },
  },
  { timestamps: true }
);

// Prevent compiling model multiple times on hot reloads
export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
