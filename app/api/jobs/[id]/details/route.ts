import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/get-server-user";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const supabase = getServerClient();

    const [revisions, analysis, cvs] = await Promise.all([
      supabase
        .from("revisions")
        .select("*")
        .eq("job_id", id)
        .eq("user_id", user.id)
        .order("revision_number", { ascending: true }),
      supabase
        .from("keyword_analysis")
        .select("*")
        .eq("job_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);

    return NextResponse.json({
      revisions: revisions.data || [],
      analysis: analysis.data || [],
      cvs: cvs.data || [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
