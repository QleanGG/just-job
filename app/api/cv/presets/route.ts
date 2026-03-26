import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("cvs")
      .select("*")
      .eq("is_preset", true)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("GET /api/cv/presets error:", error);
    return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 });
  }
}
