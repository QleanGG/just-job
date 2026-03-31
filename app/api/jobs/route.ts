import { NextRequest, NextResponse } from "next/server";
import { getJobs, createJob } from "@/lib/supabase";
import { getServerUser } from "@/lib/get-server-user";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "200");
    const jobs = await getJobs(limit, user.id);
    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, cvId, jobUrl, jobTitle, jobCompany, jobDescription } = await request.json();

    if (!id || !jobTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const job = await createJob({
      id,
      cv_id: cvId || null,
      job_url: jobUrl || null,
      job_title: jobTitle,
      job_company: jobCompany || null,
      job_description: jobDescription || null,
      status: "draft",
      user_id: user.id,
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Job create error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
