import { NextRequest, NextResponse } from "next/server";
import { scrapeJobUrl, parseJobText } from "@/lib/scraper";
import { getServerUser } from "@/lib/get-server-user";
import { z } from "zod";

const schema = z.object({
  url: z.string().url().optional(),
  text: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { url, text } = schema.parse(body);

    if (!url && !text) {
      return NextResponse.json(
        { error: "Either url or text must be provided" },
        { status: 400 }
      );
    }

    let job;
    if (url) {
      job = await scrapeJobUrl(url);
    } else {
      job = parseJobText(text!);
    }

    return NextResponse.json(job);
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
