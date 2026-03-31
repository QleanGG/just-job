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
    const { data, error } = await supabase
      .from("revisions")
      .select("*")
      .eq("job_id", id)
      .eq("user_id", user.id)
      .order("revision_number", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 });
  }
}
