import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("keyword_analysis")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("GET /api/jobs/[id]/analysis error:", error);
    return NextResponse.json({ error: "Failed to fetch keyword analysis" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { revisionId, matchedKeywords, missedKeywords } = await request.json();

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("keyword_analysis")
      .insert({
        job_id: id,
        revision_id: revisionId || null,
        matched_keywords: Array.isArray(matchedKeywords) ? matchedKeywords : [],
        missed_keywords: Array.isArray(missedKeywords) ? missedKeywords : [],
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("POST /api/jobs/[id]/analysis error:", error);
    return NextResponse.json({ error: "Failed to save keyword analysis" }, { status: 500 });
  }
}
