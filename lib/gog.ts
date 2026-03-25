import { execSync } from "child_process";
import { ParseResult, CVSection, SectionType } from "./types";

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
    patterns: [/^(skills|technical skills|core competencies|competencies)/i],
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
  const lines = markdown.split("\n");
  const sections: CVSection[] = [];
  let currentSection: { title: string; lines: string[] } | null = null;
  let originalIndex = 0;

  for (const line of lines) {
    // Check if this is a heading (## Section Title)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        sections.push({
          type: detectSectionType(currentSection.title),
          title: currentSection.title,
          content: currentSection.lines.join("\n").trim(),
          originalIndex,
        });
        originalIndex++;
      }
      // Start new section
      currentSection = { title: headingMatch[2], lines: [] };
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    sections.push({
      type: detectSectionType(currentSection.title),
      title: currentSection.title,
      content: currentSection.lines.join("\n").trim(),
      originalIndex,
    });
  }

  return { sections, rawText: markdown };
}

function extractDocId(urlOrId: string): string {
  // Check if it's already just an ID (no slashes)
  if (!urlOrId.includes("/")) {
    return urlOrId;
  }

  // Extract doc ID from various Google Docs URL formats
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9-_]+)/,
    /\/docs\/d\/([a-zA-Z0-9-_]+)/,
    /\/document\/u\/[0-9]+\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match) {
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
    // Use gog docs cat to read the document content
    const command = `gog docs cat "${docId}"`;
    const output = execSync(command, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });

    // gog outputs markdown/text, parse it into sections
    return parseMarkdownToSections(output);
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not authenticated") || msg.includes("auth") || msg.includes("login")) {
        throw new Error(
          "Not authenticated with Google. Run 'gog auth login' first."
        );
      }
      if (msg.includes("not found") || msg.includes("no such document")) {
        throw new Error("Document not found or you don't have access to it.");
      }
      throw new Error(`Failed to read document: ${error.message}`);
    }
    throw error;
  }
}

export async function createDocFromContent(
  title: string,
  content: string
): Promise<string> {
  try {
    // Use gog docs create to make a new document
    const command = `echo '${content.replace(/'/g, "'\\''")}' | gog docs create "${title}"`;
    const output = execSync(command, { encoding: "utf-8" });

    // Try to parse the output for the new document URL
    // gog may output: Created: https://docs.google.com/document/d/ID/edit
    // or JSON: {"id": "...", "url": "..."}
    const urlMatch = output.match(/https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9-_]+/);
    if (urlMatch) {
      return urlMatch[0];
    }

    // Try JSON parsing
    try {
      const parsed = JSON.parse(output);
      if (parsed.url || parsed.docUrl || parsed.link || parsed.resourceId) {
        const id = parsed.url || parsed.docUrl || parsed.link || parsed.resourceId;
        if (id.includes("docs.google.com")) {
          return id;
        }
        return `https://docs.google.com/document/d/${id}/edit`;
      }
    } catch {
      // Not JSON
    }

    throw new Error("Could not parse document URL from gog output");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
    throw error;
  }
}
