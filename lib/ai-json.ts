function stripMarkdownCodeFences(content: string) {
  return content.replace(/```json\s*/i, "").replace(/```\s*/g, "").trim();
}

function extractJsonObject(content: string) {
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Could not find JSON object in AI response");
  }

  return content.slice(firstBrace, lastBrace + 1);
}

function sanitizeControlCharacters(content: string) {
  return content.replace(/[\u0000-\u001f\u2028\u2029]/g, " ");
}

export function parseJsonObjectFromModelResponse(content: string): unknown {
  const cleaned = stripMarkdownCodeFences(content);
  const candidates = [cleaned, extractJsonObject(cleaned)];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {}

    try {
      return JSON.parse(sanitizeControlCharacters(candidate));
    } catch {}
  }

  throw new Error("Could not parse AI response as JSON");
}
