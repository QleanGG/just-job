import { NextRequest, NextResponse } from "next/server";
import { updateJob } from "@/lib/supabase";

// This API route talks to ME (Crash) via the OpenClaw Gateway

const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "1962d93a4af1092a55758fa49d7b62f54970228ac0292958";
const GATEWAY_URL = "http://127.0.0.1:18789";

const TAILOR_PROMPT = `You are tailoring a CV for a job application. Analyze the job description and rewrite the CV sections to maximize ATS fit.

RULES:
- Only rewrite content that EXISTS — never invent jobs, skills, or achievements
- Use keywords from the job description naturally
- Quantify achievements when possible
- Prioritize relevant skills/experience, deprioritize irrelevant ones
- For experience bullets: reframe each one toward job requirements
- For skills: reorder to match role
- For summary: rewrite to highlight direct fit
- Keep language concise and impactful
- Preserve the person's actual voice and real experience

OUTPUT: ONLY valid JSON, no markdown:
{
  "sections": [
    {
      "index": 0,
      "tailored": "rewritten content",
      "changes": [
        {"original": "exact original", "tailored": "rewritten", "changeType": "reword|add|remove|reorder"}
      ]
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { cv, job, jobId } = await request.json();

    if (!cv || !job) {
      return NextResponse.json({ error: "Missing cv or job data" }, { status: 400 });
    }

    // Mark job as tailoring
    if (jobId) {
      updateJob(jobId, { status: "tailoring" });
    }

    const sectionsText = cv
      .map((s: { title: string; content: string }, i: number) =>
        `--- SECTION ${i + 1}: ${s.title} ---\n${s.content}`
      )
      .join("\n\n");

    const userPrompt = `TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

CV SECTIONS:
${sectionsText}

Rewrite each section. Return ONLY valid JSON.`;

    // Call the Gateway's OpenAI-compatible endpoint → ME (Crash)
    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        model: "openclaw:main",
        messages: [
          { role: "system", content: TAILOR_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gateway error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response from agent");
    }

    // Parse JSON response
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse response as JSON");
      }
    }

    // Map back to TailoredSection format
    const tailoredSections = cv.map((section: { title: string; content: string; type: string; originalIndex: number }, idx: number) => {
      const tailoredData = parsed.sections?.find((s: { index: number }) => s.index === idx);
      const changes = (tailoredData?.changes || []).map((c: { original: string; tailored: string; changeType: string }) => ({
        original: c.original || "",
        tailored: c.tailored || "",
        changeType: c.changeType || "keep",
      }));

      return {
        ...section,
        content: (tailoredData?.tailored || section.content)
          .replace(/^##\s+.+\n?/i, "")
          .trim(),
        changes,
      };
    });

    return NextResponse.json({ tailoredSections });
  } catch (error) {
    console.error("Tailor error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tailoring failed" },
      { status: 500 }
    );
  }
}
