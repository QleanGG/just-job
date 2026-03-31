import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { copyGoogleDoc, replaceSectionsInGoogleDoc } from "@/lib/google-docs";
import { getServerClient } from "@/lib/supabase";
import { parseJsonObjectFromModelResponse } from "@/lib/ai-json";
import { getServerUser } from "@/lib/get-server-user";

const TAILOR_SYSTEM = `You are tailoring a CV for a job application. Preserve the person's real experience while maximizing relevance.

RULES:
- Only rewrite content that EXISTS — never invent jobs, skills, or achievements
- Use keywords from the job description naturally and prominently
- Quantify achievements when possible
- For experience: reframe each bullet toward job requirements
- For skills: reorder to match role
- For summary: rewrite to highlight direct fit
- Keep language concise and impactful
- Preserve the person's actual voice

OUTPUT FORMAT - MUST MATCH EXACTLY:
{"sections": [{"index": 0, "tailored": "rewritten plain text content for section 0", "changes": [{"original": "exact original text", "tailored": "rewritten text", "changeType": "reword"}]}]}
- "sections" must be an array
- Each section MUST have "index", "tailored", and "changes"
- "index" is the section number (0, 1, 2...)
- "tailored" is the rewritten plain text (no JSON inside)
- "changes" is an array of change objects
- Return ONLY valid JSON, no markdown, no code fences`;

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId, previousSections, feedback, job, cvUrl } = await request.json();

    if (!jobId || !job) {
      return NextResponse.json({ error: "Missing jobId or job" }, { status: 400 });
    }

    const supabase = getServerClient();

    const { data: revisions } = await supabase
      .from("revisions")
      .select("revision_number")
      .eq("job_id", jobId)
      .order("revision_number", { ascending: false })
      .limit(1);

    const revisionNumber = (revisions?.[0]?.revision_number || 0) + 1;

    const MAX_CHARS = 800;
    const sectionsText = previousSections
      .map((section: { title: string; content: string }, index: number) => {
        const truncated = section.content.length > MAX_CHARS
          ? section.content.slice(0, MAX_CHARS) + "..."
          : section.content;
        return `--- SECTION ${index + 1}: ${section.title} ---\n${truncated}`;
      })
      .join("\n\n");

    const jobDesc = job.description.length > 1500
      ? job.description.slice(0, 1500) + "..."
      : job.description;

    const userPrompt = `TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${jobDesc}

${feedback ? `PREVIOUS FEEDBACK: "${feedback}"\nApply this feedback when rewriting.\n` : ""}CV SECTIONS:
${sectionsText}

Rewrite each section. Return ONLY valid JSON, no markdown fences.`;

    const client = getOpenAIClient();
    const model = process.env.TAILOR_MODEL || "minimax/minimax-m2.7";

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: TAILOR_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = parseJsonObjectFromModelResponse(content) as {
      sections?: Array<{
        index: number;
        tailored?: string;
        changes?: Array<{
          original?: string;
          tailored?: string;
          changeType?: string;
        }>;
      }>;
    };

    const tailoredSections = previousSections.map((section: { title: string; content: string; type: string; originalIndex: number }, index: number) => {
      const tailoredData = parsed.sections?.find((item: { index: number }) => item.index === index);
      return {
        ...section,
        content: (tailoredData?.tailored || section.content).replace(/^##\s+.+\n?/i, "").trim().replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, ""),
        changes: (tailoredData?.changes || []).map((change: { original?: string; tailored?: string; changeType?: string }) => ({
          original: (change.original || "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, ""),
          tailored: (change.tailored || "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, ""),
          changeType: change.changeType || "keep",
        })),
      };
    });

    // Simple keyword extraction
    const jobKeywords = job.description.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const cvText = previousSections.map((section: { content: string }) => section.content.toLowerCase()).join(" ");
    const cvKeywords = new Set(cvText.match(/\b[a-z]{4,}\b/g) || []);
    const matchedKeywords = [...new Set(jobKeywords)].filter(w => cvKeywords.has(w));
    const missedKeywords = [...new Set(jobKeywords)].filter(w => !cvKeywords.has(w));

    let newDocUrl = "";
    if (cvUrl) {
      try {
        const newTitle = `${job.title} @ ${job.company} — v${revisionNumber}`;
        const { documentId } = await copyGoogleDoc(cvUrl, newTitle);
        await replaceSectionsInGoogleDoc(documentId, previousSections, tailoredSections);
        newDocUrl = `https://docs.google.com/document/d/${documentId}/edit`;
      } catch (err) {
        console.error("Failed to create Google Doc:", err);
      }
    }

    const { data: revisionData, error: revisionError } = await supabase
      .from("revisions")
      .insert({
        job_id: jobId,
        user_id: user.id,
        revision_number: revisionNumber,
        tailored_cv_url: newDocUrl || null,
        feedback: feedback || null,
        tailored_sections: tailoredSections,
      })
      .select("id")
      .single();

    if (revisionError || !revisionData) throw revisionError || new Error("Failed to create revision");

    const revisionId = revisionData.id;

    await supabase.from("keyword_analysis").insert({
      job_id: jobId,
      user_id: user.id,
      revision_id: revisionId,
      matched_keywords: matchedKeywords,
      missed_keywords: missedKeywords,
    });

    await supabase
      .from("jobs")
      .update({
        status: "done",
        tailored_cv_url: newDocUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId).eq("user_id", user.id);

    return NextResponse.json({
      revisionId,
      revisionNumber,
      newDocUrl,
      tailoredSections,
      keywordAnalysis: { matchedKeywords, missedKeywords },
    });
  } catch (error) {
    console.error("Revision error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Revision failed" },
      { status: 500 }
    );
  }
}
