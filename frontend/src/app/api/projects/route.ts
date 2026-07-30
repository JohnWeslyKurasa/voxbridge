import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import Project from "@/models/Project";
import User from "@/models/User";
import "@/models/MediaFile"; // Required for schema populate
import "@/models/Translation"; // Required for schema populate

/**
 * Fetch User-Specific Projects API Route — GET /api/projects
 *
 * Why it is needed:
 * - Supplies the dashboard, history, and project list with ONLY the logged-in user's projects.
 * - Prevents data leakage between different email accounts.
 *
 * How it works:
 * 1. Connects to MongoDB.
 * 2. Fetches current authenticated user via Clerk server SDK (`currentUser`).
 * 3. Looks up corresponding MongoDB `User` profile by `clerkId` or `email`.
 * 4. Queries `Project` records owned ONLY by that user profile.
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const paramUserId = url.searchParams.get("userId");

    // 1. Fetch authenticated user from Clerk
    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
    const effectiveClerkId = clerkUser?.id || paramUserId;

    if (!effectiveClerkId && !primaryEmail) {
      // Unauthenticated or guest — return empty projects array safely
      return NextResponse.json({
        success: true,
        projects: [],
      });
    }

    // 2. Find matching local User profile by clerkId or primary email
    const queryConditions: Array<{ clerkId?: string; email?: string }> = [];
    if (effectiveClerkId) queryConditions.push({ clerkId: effectiveClerkId });
    if (primaryEmail) queryConditions.push({ email: primaryEmail });

    const dbUser = await User.findOne({ $or: queryConditions });

    if (!dbUser) {
      // User logged in with a new email address for the first time — zero projects
      return NextResponse.json({
        success: true,
        projects: [],
      });
    }

    // 3. Query projects owned by this user profile ONLY
    const projects = await Project.find({ owner: dbUser._id })
      .populate("sourceMedia")
      .populate("translation")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      projects: projects || [],
    });
  } catch (error: unknown) {
    console.error("❌ Error fetching user projects:", error);
    return NextResponse.json({
      success: true,
      projects: [],
    });
  }
}

export const dynamic = "force-dynamic";
