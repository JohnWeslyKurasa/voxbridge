import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import { FREE_TRIAL_LIMIT } from "@/models/User";

/**
 * GET /api/user/status
 * Returns trial usage, plan, and projectsUsed for the authenticated user.
 * Used by the dashboard, upload page, and trial gating logic.
 */
export async function GET() {
  try {
    await connectToDatabase();

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
    const effectiveClerkId = clerkUser.id;

    const conditions: Array<{ clerkId?: string; email?: string }> = [
      { clerkId: effectiveClerkId }
    ];
    if (primaryEmail) conditions.push({ email: primaryEmail });

    let dbUser = await User.findOne({ $or: conditions });

    if (!dbUser) {
      // First time user — create profile
      dbUser = await User.create({
        clerkId: effectiveClerkId,
        fullName: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "VoxBridge User",
        email: primaryEmail || `${effectiveClerkId}@voxbridge.ai`,
        plan: "free",
        credits: FREE_TRIAL_LIMIT,
        projectsUsed: 0,
        trialExpired: false,
      });
    }

    // Recompute projectsUsed from actual DB count (source of truth)
    const actualCount = await Project.countDocuments({ owner: dbUser._id });
    const trialExpired = dbUser.plan === "free" && actualCount >= FREE_TRIAL_LIMIT;

    // Sync if diverged
    if (dbUser.projectsUsed !== actualCount || dbUser.trialExpired !== trialExpired) {
      await User.findByIdAndUpdate(dbUser._id, {
        projectsUsed: actualCount,
        trialExpired,
      });
    }

    return NextResponse.json({
      success: true,
      plan: dbUser.plan,
      projectsUsed: actualCount,
      trialLimit: FREE_TRIAL_LIMIT,
      trialExpired,
      projectsRemaining: Math.max(0, FREE_TRIAL_LIMIT - actualCount),
      isPro: dbUser.plan !== "free",
    });
  } catch (err: unknown) {
    console.error("❌ /api/user/status error:", err);
    return NextResponse.json({ error: "Failed to fetch user status." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
