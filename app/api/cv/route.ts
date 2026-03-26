import { NextRequest, NextResponse } from "next/server";
import { getCvs, upsertCv } from "@/lib/supabase";

export async function GET() {
  try {
    const cvs = getCvs();
    // Parse the JSON sections back
    const parsed = cvs.map(cv => ({
      ...cv,
      parsed_sections: cv.parsed_sections ? JSON.parse(cv.parsed_sections) : null,
    }));
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch CVs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, name, docUrl, parsedSections } = await request.json();

    if (!id || !docUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cv = upsertCv(id, name || "Master CV", docUrl, parsedSections || []);
    return NextResponse.json({
      ...cv,
      parsed_sections: cv.parsed_sections ? JSON.parse(cv.parsed_sections) : null,
    });
  } catch (error) {
    console.error("CV save error:", error);
    return NextResponse.json({ error: "Failed to save CV" }, { status: 500 });
  }
}
