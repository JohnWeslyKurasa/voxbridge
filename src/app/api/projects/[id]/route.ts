import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Project from "@/models/Project";
import MediaFile from "@/models/MediaFile";
import Translation from "@/models/Translation";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: "Missing project ID." }, { status: 400 });
    }

    await connectToDatabase();

    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Clean up linked MediaFile and Translation documents
    if (project.sourceMedia) {
      await MediaFile.findByIdAndDelete(project.sourceMedia);
    }
    if (project.translation) {
      await Translation.findByIdAndDelete(project.translation);
    }

    // Delete Project document
    await Project.findByIdAndDelete(projectId);

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete project";
    console.error("❌ Error deleting project:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
