import { NextRequest, NextResponse } from "next/server";
import { parseCVFromUrl } from "@/lib/gog";
import { upsertCv } from "@/lib/supabase";
import { getServerUser } from "@/lib/get-server-user";
import { z } from "zod";

const parseSchema = z.object({
  docUrl: z.string().url("Invalid Google Docs URL"),
  cvId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { docUrl, cvId } = parseSchema.parse(body);

    const result = await parseCVFromUrl(docUrl);

    const saved = await upsertCv({ id: cvId, name: "Master CV", docUrl, parsedSections: result.sections, userId: user.id });
    const returnedId = saved?.id || cvId;

    return NextResponse.json({
      sections: result.sections,
      cvId: returnedId,
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
