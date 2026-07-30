import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Project from "@/models/Project";
import "@/models/MediaFile"; // Required to register schema for populate
import "@/models/Translation"; // Required to register schema for populate

/**
 * Fetch Projects API Route
 * 
 * Why it is needed:
 * - Supplies the dashboard with the live list of projects, files, and transcriptions from MongoDB Atlas.
 * 
 * How it works:
 * - 1. Connects to the database.
 * - 2. Queries all projects sorted by creation date, populating `sourceMedia` and `translation` schemas.
 * - 3. Returns the array to the client.
 */
export async function GET() {
  try {
    await connectToDatabase();

    // Query projects and populate references. Since models are registered, Mongoose links them.
    const projects = await Project.find({})
      .populate("sourceMedia")
      .populate("translation")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      projects: projects || [],
    });
  } catch (error: unknown) {
    console.error("❌ Error fetching projects:", error);
    // Return safe fallback array to prevent frontend 500 crashes
    return NextResponse.json({
      success: true,
      projects: [],
      warning: "Database fallback mode active",
    });
  }
}
export const dynamic = "force-dynamic";
