import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/get-server-user";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("cvs")
      .select("*")
      .eq("is_preset", true)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("GET /api/cv/presets error:", error);
    return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 });
  }
}
