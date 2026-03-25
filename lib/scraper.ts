import * as cheerio from "cheerio";
import { JobListing } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchWithCheerio(
  url: string
): Promise<{ $: cheerio.CheerioAPI; source: JobListing["source"] }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  let source: JobListing["source"] = "manual";

  if (url.includes("linkedin.com")) source = "linkedin";
  else if (url.includes("indeed.com")) source = "indeed";
  else if (url.includes("greenhouse")) source = "greenhouse";
  else if (url.includes("lever.co")) source = "lever";
  else if (url.includes("workday.com")) source = "workday";

  return { $, source };
}

function extractLinkedIn($: cheerio.CheerioAPI): Partial<JobListing> {
  const title =
    $(".job-details-jobs-unified-top-card__job-title").text().trim() ||
    $("h1").first().text().trim() ||
    "";

  const company =
    $(".job-details-jobs-unified-top-card__company-name").text().trim() ||
    $(".top-card-link").first().text().trim() ||
    "";

  // LinkedIn is tough - the job description is often in a JSON script tag
  // or in the described-section
  let description = "";

  // Try to find the description in the provided section
  const describedSection = $("#job-details").html() || "";
  description = cheerio.load(describedSection).text().trim();

  // If that doesn't work, try the apply section
  if (!description) {
    description = $(".jobs-description-content__text").text().trim() || "";
  }

  return { title, company, description };
}

function extractIndeed($: cheerio.CheerioAPI): Partial<JobListing> {
  const title =
    $("h2.jobTitle").text().trim() ||
    $("[data-job-title]").attr("data-job-title") ||
    $("h1").first().text().trim() ||
    "";

  const company =
    $("[data-testid='job-company-name']").text().trim() ||
    $(".companyName").text().trim() ||
    "";

  const description =
    $("#jobDescriptionText").text().trim() ||
    $(".jobsearch-JobComponent").text().trim() ||
    "";

  return { title, company, description };
}

function extractGreenhouse($: cheerio.CheerioAPI): Partial<JobListing> {
  // Actually it's CheerioAPI not CheesiumAPI, let me fix
  const title = $("h1").first().text().trim() || "";
  const company = $(".company-name").text().trim() || "";
  const description = $("#content").text().trim() || "";

  return { title, company, description };
}

function extractGeneric($: cheerio.CheerioAPI): Partial<JobListing> {
  // Generic extraction - try common patterns
  const title =
    $("h1").first().text().trim() ||
    $("[class*='title']").first().text().trim() ||
    "";

  const company =
    $("[class*='company']").first().text().trim() ||
    $("a[href*='company']").first().text().trim() ||
    "";

  // Try to find the main content area
  const description =
    $("[class*='description']").text().trim() ||
    $("[class*='content']").text().trim() ||
    $("main").text().trim() ||
    $("article").text().trim() ||
    $("body").text().trim();

  return { title, company, description };
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

export async function scrapeJobUrl(url: string): Promise<JobListing> {
  const { $, source } = await fetchWithCheerio(url);

  let partial: Partial<JobListing>;

  switch (source) {
    case "linkedin":
      partial = extractLinkedIn($);
      break;
    case "indeed":
      partial = extractIndeed($);
      break;
    case "greenhouse":
      partial = extractGreenhouse($);
      break;
    // Add other sources as needed
    default:
      partial = extractGeneric($);
  }

  const description = cleanText(partial.description || "");

  if (!description) {
    throw new Error(
      "Could not extract job description. Try pasting the text directly instead."
    );
  }

  return {
    title: partial.title || "Unknown Role",
    company: partial.company || "Unknown Company",
    description,
    source,
    url,
  };
}

export function parseJobText(text: string): JobListing {
  // Try to detect title and company from the text
  const lines = text.split("\n").filter((l) => l.trim());
  let title = "";
  let company = "";

  // First non-empty line is often the title
  // Look for patterns like "Title at Company" or "Title - Company"
  const firstLine = lines[0] || "";
  const titleCompanyMatch = firstLine.match(/^(.+?)\s+(?:at|@|,|-|·)\s+(.+)$/);

  if (titleCompanyMatch) {
    title = titleCompanyMatch[1].trim();
    company = titleCompanyMatch[2].trim();
  } else {
    title = firstLine;
  }

  // Remove the title line if we extracted it
  const descriptionLines = titleCompanyMatch ? lines.slice(1) : lines;
  const description = cleanText(descriptionLines.join("\n"));

  return {
    title: title || "Job Application",
    company: company || "",
    description,
    source: "manual",
  };
}
