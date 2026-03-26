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
      .from("revisions")
      .select("*")
      .eq("job_id", id)
      .order("revision_number", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("GET /api/jobs/[id]/revisions error:", error);
    return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 });
  }
}
