import { NextRequest, NextResponse } from "next/server";
import { deleteCv, getCvs, upsertCv, getServerClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/get-server-user";

function parseStoredSections(parsedSections: unknown) {
  if (Array.isArray(parsedSections)) {
    return parsedSections;
  }
  if (typeof parsedSections === "string") {
    try {
      return JSON.parse(parsedSections);
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const presetOnly = new URL(request.url).searchParams.get("preset") === "true";
    const supabase = getServerClient();
    let query = supabase.from("cvs").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const parsed = (data || []).map((cv) => ({
      ...cv,
      parsed_sections: parseStoredSections(cv.parsed_sections),
    }));

    if (presetOnly) {
      return NextResponse.json(parsed.find((cv) => cv.is_preset) || null);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("CV fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch CVs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, docUrl, parsedSections, isPreset, displayName } = await request.json();

    if (!docUrl) {
      return NextResponse.json({ error: "Missing docUrl" }, { status: 400 });
    }

    const cv = await upsertCv({
      id,
      name: name || "Master CV",
      docUrl,
      parsedSections: parsedSections || [],
      isPreset: Boolean(isPreset),
      displayName: displayName || null,
      userId: user.id,
    });

    return NextResponse.json({
      ...cv,
      parsed_sections: parseStoredSections(cv.parsed_sections),
    });
  } catch (error) {
    console.error("CV save error:", error);
    return NextResponse.json({ error: "Failed to save CV" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const supabase = getServerClient();
    const { error } = await supabase
      .from("cvs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CV delete error:", error);
    return NextResponse.json({ error: "Failed to delete CV" }, { status: 500 });
  }
}
