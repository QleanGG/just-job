import { execFileSync } from "child_process";
import { copyGoogleDoc, replaceSectionsInGoogleDoc } from "./google-docs";
import { ParseResult, CVSection, SectionType } from "./types";

const DEFAULT_ACCOUNT = process.env.GOG_ACCOUNT || "guyguz1@gmail.com";

const SECTION_PATTERNS: { type: SectionType; patterns: RegExp[] }[] = [
  {
    type: "summary",
    patterns: [
      /^(summary|profile|about|objective|professional summary)/i,
    ],
  },
  {
    type: "experience",
    patterns: [
      /^(experience|work experience|employment|professional experience|work history)/i,
    ],
  },
  {
    type: "skills",
    patterns: [/^(skills|technical skills|core competencies|competencies|proficiencies|technologies)/i],
  },
  {
    type: "education",
    patterns: [
      /^(education|academic|qualifications|degrees)/i,
    ],
  },
  {
    type: "certifications",
    patterns: [
      /^(certifications|certificates|licenses|accreditations)/i,
    ],
  },
  {
    type: "other",
    patterns: [
      /^(languages|language)/i,
    ],
  },
];

const ALL_CAPS_SECTION_HEADERS = [
  "PROFILE", "SUMMARY", "ABOUT", "OBJECTIVE",
  "WORK EXPERIENCE", "EXPERIENCE", "WORK HISTORY", "EMPLOYMENT",
  "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "COMPETENCIES",
  "PROFICIENCIES", "TOOLS", "TECHNOLOGIES",
  "EDUCATION", "ACADEMIC", "QUALIFICATIONS",
  "CERTIFICATIONS", "CERTIFICATES", "LICENSES",
  "PROJECTS", "PORTFOLIO",
  "LANGUAGES", "LANGUAGE",
];

function detectSectionType(title: string): SectionType {
  const cleanTitle = title.trim();

  for (const { type, patterns } of SECTION_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(cleanTitle)) {
        return type;
      }
    }
  }
  return "other";
}

function parseMarkdownToSections(markdown: string): ParseResult {
  const clean = markdown.replace(/\x1b\[[0-9;]*m/g, "");
  const lines = clean.split("\n");
  const sections: CVSection[] = [];
  let currentSection: { title: string; lines: string[] } | null = null;
  let originalIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push({
          type: detectSectionType(currentSection.title),
          title: currentSection.title,
          content: currentSection.lines.join("\n").trim(),
          originalIndex,
        });
        originalIndex++;
      }
      currentSection = { title: headingMatch[2], lines: [] };
      continue;
    }

    const isAllCaps = trimmed.length > 2 &&
      trimmed.length < 60 &&
      /^[A-Z][A-Z\s\-–]+$/.test(trimmed) &&
      ALL_CAPS_SECTION_HEADERS.some((header) => trimmed.includes(header));

    if (isAllCaps) {
      if (currentSection) {
        sections.push({
          type: detectSectionType(currentSection.title),
          title: currentSection.title,
          content: currentSection.lines.join("\n").trim(),
          originalIndex,
        });
        originalIndex++;
      }
      currentSection = { title: trimmed, lines: [] };
      continue;
    }

    if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  if (currentSection) {
    sections.push({
      type: detectSectionType(currentSection.title),
      title: currentSection.title,
      content: currentSection.lines.join("\n").trim(),
      originalIndex,
    });
  }

  return { sections, rawText: clean };
}

function validateDocId(docId: string) {
  if (!/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/.test(docId)) {
    throw new Error("Invalid document ID");
  }
}

export function extractDocId(urlOrId: string): string {
  if (!urlOrId.includes("/")) {
    validateDocId(urlOrId);
    return urlOrId;
  }

  const patterns = [
    /\/document\/d\/([a-zA-Z0-9-_]+)/,
    /\/docs\/d\/([a-zA-Z0-9-_]+)/,
    /\/document\/u\/[0-9]+\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match) {
      validateDocId(match[1]);
      return match[1];
    }
  }

  throw new Error(
    "Invalid Google Docs URL or ID. Please provide a valid URL like: https://docs.google.com/document/d/DOC_ID/edit"
  );
}

export async function parseCVFromUrl(docUrl: string): Promise<ParseResult> {
  const docId = extractDocId(docUrl);

  try {
    const output = execFileSync(
      "gog",
      ["docs", "cat", docId, "--account", DEFAULT_ACCOUNT],
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    ).replace(/\x1b\[[0-9;]*m/g, "");

    return parseMarkdownToSections(output);
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not authenticated") || msg.includes("not logged in") || msg.includes("login required")) {
        throw new Error(
          "Not authenticated with Google. Run 'gog auth login' first."
        );
      }
      if (msg.includes("not found") || msg.includes("no such document") || msg.includes("no document found")) {
        throw new Error("Document not found or you don't have access to it.");
      }
      if (msg.includes("missing --account")) {
        throw new Error("No Google account set. Set GOG_ACCOUNT or use --account.");
      }
      throw new Error(`Failed to read document: ${error.message}`);
    }
    throw error;
  }
}

export async function createDocFromContent(
  title: string,
  originalDocUrl: string,
  originalSections: CVSection[],
  tailoredSections: CVSection[]
): Promise<string> {
  try {
    const originalDocId = extractDocId(originalDocUrl);
    const { documentId, url } = await copyGoogleDoc(originalDocId, title);
    await replaceSectionsInGoogleDoc(documentId, originalSections, tailoredSections);
    return url;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
    throw error;
  }
}
