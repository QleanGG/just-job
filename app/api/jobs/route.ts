import { NextRequest, NextResponse } from "next/server";
import { getJobs, createJob } from "@/db/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const jobs = getJobs(limit);
    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, cvId, jobUrl, jobTitle, jobCompany, jobDescription } = await request.json();

    if (!id || !jobTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const job = createJob({
      id,
      cvId,
      jobUrl,
      jobTitle,
      jobCompany,
      jobDescription,
      status: "draft",
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Job create error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
