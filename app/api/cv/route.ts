import { NextRequest, NextResponse } from "next/server";
import { upsertCv, getServerClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/get-server-user";

const CV_UPLOAD_BUCKET = "cvs";
const ALLOWED_FILE_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const ALLOWED_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function parseStoredSections(parsedSections: unknown) {
  if (Array.isArray(parsedSections)) {
    return parsedSections;
  }
  if (typeof parsedSections === "string") {
    try {
      return JSON.parse(parsedSections);
    } catch {
      return null;
    }
  }
  return null;
}

function getBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").trim() || "Uploaded CV";
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

async function ensureCvUploadBucket() {
  const supabase = getServerClient();
  const { error } = await supabase.storage.createBucket(CV_UPLOAD_BUCKET, {
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: Array.from(ALLOWED_FILE_MIME_TYPES),
  });

  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw error;
  }
}

async function handleUploadedFile(request: NextRequest, userId: string) {
  const formData = await request.formData();
  const fileEntry = formData.get("file");

  if (!fileEntry || typeof fileEntry === "string") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const fileExtension = getFileExtension(fileEntry.name);
  const hasAllowedType =
    ALLOWED_FILE_EXTENSIONS.has(fileExtension) ||
    ALLOWED_FILE_MIME_TYPES.has(fileEntry.type);

  if (!hasAllowedType) {
    return NextResponse.json(
      { error: "Only PDF, DOC, and DOCX files are supported" },
      { status: 400 },
    );
  }

  await ensureCvUploadBucket();

  const supabase = getServerClient();
  const uploadId = crypto.randomUUID();
  const safeFileName = sanitizeFileName(fileEntry.name || `cv.${fileExtension || "pdf"}`);
  const filePath = `${userId}/${uploadId}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage.from(CV_UPLOAD_BUCKET).upload(filePath, fileEntry, {
    contentType: fileEntry.type || undefined,
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage.from(CV_UPLOAD_BUCKET).getPublicUrl(filePath);

  const cv = await upsertCv({
    id: typeof formData.get("id") === "string" ? String(formData.get("id")) : uploadId,
    name: typeof formData.get("name") === "string" ? String(formData.get("name")).trim() || getBaseName(fileEntry.name) : getBaseName(fileEntry.name),
    docUrl: publicUrlData.publicUrl,
    parsedSections: [],
    isPreset: false,
    displayName: getBaseName(fileEntry.name),
    userId,
  });

  return NextResponse.json({
    ...cv,
    parsed_sections: parseStoredSections(cv.parsed_sections),
  });
}

export async function GET(request: NextRequest) {
  let response = NextResponse.next();
  try {
    const user = await getServerUser(request, response);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const presetOnly = new URL(request.url).searchParams.get("preset") === "true";
    const supabase = getServerClient();
    let query = supabase.from("cvs").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const parsed = (data || []).map((cv) => ({
      ...cv,
      parsed_sections: parseStoredSections(cv.parsed_sections),
    }));

    if (presetOnly) {
      return NextResponse.json(parsed.find((cv) => cv.is_preset) || null);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("GET /api/cv error:", error);
    return NextResponse.json({ error: "Failed to fetch CVs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let response = NextResponse.next();
  try {
    const user = await getServerUser(request, response);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      return handleUploadedFile(request, user.id);
    }

    const { id, name, docUrl, parsedSections, isPreset, displayName } = await request.json();
    const normalizedDocUrl = typeof docUrl === "string" ? docUrl : "";

    const cv = await upsertCv({
      id,
      name: name || "Master CV",
      docUrl: normalizedDocUrl,
      parsedSections: parsedSections || [],
      isPreset: Boolean(isPreset),
      displayName: displayName || null,
      userId: user.id,
    });

    return NextResponse.json({
      ...cv,
      parsed_sections: parseStoredSections(cv.parsed_sections),
    });
  } catch (error) {
    console.error("CV save error:", error);
    return NextResponse.json({ error: "Failed to save CV" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let response = NextResponse.next();
  try {
    const user = await getServerUser(request, response);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const supabase = getServerClient();
    const { error } = await supabase
      .from("cvs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CV delete error:", error);
    return NextResponse.json({ error: "Failed to delete CV" }, { status: 500 });
  }
}
