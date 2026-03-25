import OpenAI from "openai";
import { CVSection, TailoredSection, SectionChange, JobListing } from "./types";

const AI_PROVIDER = process.env.AI_PROVIDER || "openrouter";
const MODEL = process.env.DEFAULT_MODEL || "minimax/m2.7";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not set in environment variables");
    }
    openaiClient = new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    });
  }
  return openaiClient;
}

function buildSystemPrompt(): string {
  return `You are a professional CV/resume writer specializing in ATS optimization and job-specific tailoring.

RULES:
- Only rewrite content that exists in the original CV
- Never invent skills, jobs, degrees, or achievements
- Use keywords from the job description naturally and prominently
- Quantify achievements when possible (%, $, #, time saved, etc.)
- Keep language concise and impactful
- Prioritize the most relevant items for the role
- Reorder bullets within a section to put most relevant first
- For skills: prioritize required skills, remove irrelevant ones
- For experience: reframe achievements toward the role's requirements
- For summary: rewrite to highlight direct fit for this specific role
- Output ONLY valid JSON with no markdown code fences

OUTPUT FORMAT:
Return a JSON object:
{
  "sections": [
    {
      "index": 0,
      "tailored": "rewritten content (markdown with ## for section heading)",
      "changes": [
        {
          "original": "exact original text or empty string if new",
          "tailored": "rewritten text or empty string if removed",
          "changeType": "reword|add|remove|reorder|keep"
        }
      ]
    }
  ]
}`;
}

function buildUserPrompt(
  sections: CVSection[],
  job: JobListing
): string {
  const sectionsText = sections
    .map(
      (s, i) =>
        `--- SECTION ${i + 1}: ${s.title} (${s.type}) ---\n${s.content}`
    )
    .join("\n\n");

  return `TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Description:
${job.description}

CURRENT CV SECTIONS:
${sectionsText}

Rewrite each section to maximize fit for the target job. Return ONLY valid JSON, no markdown.`;
}

export async function tailorCV(
  sections: CVSection[],
  job: JobListing
): Promise<TailoredSection[]> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(sections, job) },
    ],
    temperature: 0.5,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  // Strip any markdown code fences if present
  const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error("Invalid AI response format");
  }

  const result: TailoredSection[] = sections.map((section, idx) => {
    const tailoredData = parsed.sections.find(
      (s: { index: number }) => s.index === idx
    );

    if (!tailoredData) {
      return {
        ...section,
        changes: [],
      };
    }

    const changes: SectionChange[] = (tailoredData.changes || []).map(
      (c: { original: string; tailored: string; changeType: string }) => ({
        original: c.original || "",
        tailored: c.tailored || "",
        changeType: c.changeType as SectionChange["changeType"],
      })
    );

    // Extract just the content (strip ## heading if AI included it)
    let tailoredContent = tailoredData.tailored || section.content;
    tailoredContent = tailoredContent.replace(/^##\s+.+\n?/i, "").trim();

    return {
      ...section,
      content: tailoredContent,
      changes,
    };
  });

  return result;
}
