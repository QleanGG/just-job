import { NextRequest, NextResponse } from "next/server";
import { createDocFromContent } from "@/lib/gog";
import { updateJob } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { tailoredSections, jobId, jobTitle, company } = await request.json();

    // Build markdown content from tailored sections
    const content = tailoredSections
      .sort((a: { originalIndex: number }, b: { originalIndex: number }) => a.originalIndex - b.originalIndex)
      .map((section: { title: string; content: string }) => `## ${section.title}\n\n${section.content}`)
      .join("\n\n");

    // Generate title
    const title = jobTitle
      ? `CV — ${jobTitle}${company ? ` @ ${company}` : ""}`
      : `Tailored CV — ${new Date().toLocaleDateString()}`;

    // Create the Google Doc
    const newDocUrl = await createDocFromContent(title, content);

    // Update job status to done with the URL
    if (jobId) {
      updateJob(jobId, { status: "done", tailoredCvUrl: newDocUrl });
    }

    return NextResponse.json({ newDocUrl, title });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
