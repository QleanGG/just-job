import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { google, docs_v1 } from "googleapis";
import { CVSection } from "./types";

const DEFAULT_ACCOUNT = process.env.GOG_ACCOUNT || "guyguz1@gmail.com";
const DEFAULT_CLIENT = process.env.GOG_CLIENT_NAME || "default";

function loadRefreshToken(): string {
  const tempDir = mkdtempSync(join(require("os").tmpdir(), "cv-tailor-gog-token-"));
  const tokenPath = join(tempDir, "token.json");

  try {
    const result = execFileSync("gog", [
      "auth", "tokens", "export", DEFAULT_ACCOUNT,
      "--client", DEFAULT_CLIENT,
      "--out", tokenPath, "--overwrite",
    ], { encoding: "utf-8", env: process.env });

    const tokenPayload = JSON.parse(readFileSync(tokenPath, "utf-8")) as { refresh_token?: string };
    if (!tokenPayload.refresh_token) {
      throw new Error("Exported gog token did not contain a refresh_token");
    }
    return tokenPayload.refresh_token;
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

async function getDocsClient() {
  const raw = JSON.parse(readFileSync("/home/guy/.config/gogcli/credentials.json", "utf-8"));
  const wrapped = raw as { installed?: { client_id: string; client_secret: string }; web?: { client_id: string; client_secret: string } };
  const creds = wrapped.installed || wrapped.web;
  if (!creds?.client_id || !creds?.client_secret) {
    throw new Error("Missing Google OAuth credentials");
  }

  const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
  auth.setCredentials({ refresh_token: loadRefreshToken() });
  await auth.getAccessToken();

  return google.docs({ version: "v1", auth });
}

export async function copyGoogleDoc(
  originalDocId: string,
  newTitle: string
): Promise<{ documentId: string; url: string }> {
  const output = execFileSync("gog", [
    "drive", "copy", originalDocId, newTitle,
    "--account", DEFAULT_ACCOUNT,
    "--client", DEFAULT_CLIENT,
    "--json", "--results-only",
  ], { encoding: "utf-8", env: process.env });

  const cleaned = output.trim();
  const urlMatch = cleaned.match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return { documentId: urlMatch[1], url: cleaned };
  }

  // Try JSON parse
  const parsed = JSON.parse(cleaned);
  const id = parsed.id || parsed.fileId;
  const url = parsed.link || `https://docs.google.com/document/d/${id}/edit`;
  return { documentId: id, url };
}

type DocumentParagraph = {
  startIndex: number;
  endIndex: number;
  contentStartIndex: number;
  contentEndIndex: number;
  text: string;
};

type MatchedSection = {
  section: CVSection;
  titleIndex: number;
  nextTitleIndex: number;
};

function getDocumentParagraphs(document: docs_v1.Schema$Document): DocumentParagraph[] {
  const paragraphs: DocumentParagraph[] = [];

  for (const element of document.body?.content || []) {
    if (!element.paragraph) continue;

    const rawText = (element.paragraph.elements || [])
      .map(segment => segment.textRun?.content || "")
      .join("");
    const startIndex = element.startIndex ?? element.paragraph.elements?.[0]?.startIndex;
    const endIndex = element.endIndex
      ?? element.paragraph.elements?.[element.paragraph.elements.length - 1]?.endIndex;

    if (startIndex == null || endIndex == null) continue;

    paragraphs.push({
      startIndex,
      endIndex,
      contentStartIndex: startIndex,
      contentEndIndex: rawText.endsWith("\n") ? Math.max(startIndex, endIndex - 1) : endIndex,
      text: rawText.replace(/\n/g, "").trim(),
    });
  }

  return paragraphs;
}

function matchSectionParagraphs(
  paragraphs: DocumentParagraph[],
  sections: CVSection[]
): MatchedSection[] {
  const matches: MatchedSection[] = [];
  let searchStart = 0;

  for (const section of [...sections].sort((a, b) => a.originalIndex - b.originalIndex)) {
    const titleIndex = paragraphs.findIndex((paragraph, index) => {
      if (index < searchStart) return false;
      return isSectionTitleMatch(paragraph.text, section.title);
    });

    if (titleIndex === -1) continue;

    matches.push({
      section,
      titleIndex,
      nextTitleIndex: paragraphs.length,
    });
    searchStart = titleIndex + 1;
  }

  for (let index = 0; index < matches.length - 1; index++) {
    matches[index].nextTitleIndex = matches[index + 1].titleIndex;
  }

  return matches;
}

function isSectionTitleMatch(paragraphText: string, sectionTitle: string): boolean {
  const normalizedParagraph = normalizeText(paragraphText);
  const normalizedTitle = normalizeText(sectionTitle);

  return normalizedParagraph === normalizedTitle
    || normalizedParagraph.includes(normalizedTitle)
    || normalizedTitle.includes(normalizedParagraph);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

function splitSectionContent(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.trimEnd())
    .filter(line => line.trim().length > 0);
}

export async function replaceSectionsInGoogleDoc(
  documentId: string,
  originalSections: CVSection[],
  tailoredSections: CVSection[]
): Promise<void> {
  const docs = await getDocsClient();
  const doc = await docs.documents.get({ documentId });
  const paragraphs = getDocumentParagraphs(doc.data);
  const sectionMatches = matchSectionParagraphs(paragraphs, originalSections);
  const requests: docs_v1.Schema$Request[] = [];

  for (const match of [...sectionMatches].reverse()) {
    const tailoredSection = tailoredSections.find(
      section => section.originalIndex === match.section.originalIndex
    );
    if (!tailoredSection) continue;

    const newParagraphs = splitSectionContent(tailoredSection.content);
    const contentParagraphs = paragraphs
      .slice(match.titleIndex + 1, match.nextTitleIndex)
      .filter(paragraph => paragraph.text.length > 0);

    if (contentParagraphs.length === 0) continue;

    for (let index = contentParagraphs.length - 1; index >= 0; index--) {
      const paragraph = contentParagraphs[index];
      const replacementText = index >= newParagraphs.length
        ? ""
        : index === contentParagraphs.length - 1
          ? newParagraphs.slice(index).join("\n")
          : newParagraphs[index];

      if (paragraph.contentEndIndex > paragraph.contentStartIndex) {
        requests.push({
          deleteContentRange: {
            range: {
              startIndex: paragraph.contentStartIndex,
              endIndex: paragraph.contentEndIndex,
            },
          },
        });
      }

      if (!replacementText) continue;

      requests.push({
        insertText: {
          location: { index: paragraph.contentStartIndex },
          text: replacementText,
        },
      });
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: paragraph.contentStartIndex,
            endIndex: paragraph.contentStartIndex + replacementText.length,
          },
          textStyle: {},
          fields: "bold,italic,underline,strikethrough,foregroundColor,backgroundColor,fontSize,weightedFontFamily",
        },
      });
    }
  }

  if (requests.length === 0) return;

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });
}
