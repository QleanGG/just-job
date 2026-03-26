import { NextRequest, NextResponse } from "next/server";
import { parseCVFromUrl } from "@/lib/gog";
import { upsertCv } from "@/lib/supabase";
import { z } from "zod";
import { randomUUID } from "crypto";

const parseSchema = z.object({
  docUrl: z.string().url("Invalid Google Docs URL"),
  cvId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { docUrl, cvId } = parseSchema.parse(body);

    const result = await parseCVFromUrl(docUrl);

    // Save CV to SQLite
    const id = cvId || crypto.randomUUID();
    upsertCv(id, "Master CV", docUrl, result.sections);

    return NextResponse.json({
      sections: result.sections,
      cvId: id,
      saved: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
