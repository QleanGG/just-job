import { NextRequest, NextResponse } from "next/server";
import { copyGoogleDoc, replaceSectionsInGoogleDoc } from "@/lib/google-docs";
import { getServerClient } from "@/lib/supabase";
import { getServerUser } from "@/lib/get-server-user";

export async function POST(request: NextRequest) {
  let jobId: string | null = null;
  let cvUrl = "";

  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getServerClient();
    const { tailoredSections, jobId: jid, jobTitle, company, cvId, cvUrl: cUrl } = await request.json();
    jobId = jid || null;
    cvUrl = cUrl || "";

    // Sanitize content to remove control characters that break JSON
    const sanitize = (text: string) => text.replace(/[\r\n\t]/g, " ").trim();

    const title = jobTitle ? `CV — ${jobTitle}${company ? ` @ ${company}` : ""}` : `Tailored CV — ${new Date().toLocaleDateString()}`;

    let newDocUrl = "";

    if (cvUrl) {
      try {
        const { getCvById } = await import("@/lib/supabase");
        const cvData = cvId ? await getCvById(cvId, user.id) : null;
        const originalSections = cvData?.parsed_sections as Parameters<typeof replaceSectionsInGoogleDoc>[1] || tailoredSections;

        const { documentId } = await copyGoogleDoc(cvUrl, title);
        await replaceSectionsInGoogleDoc(documentId, originalSections, tailoredSections);
        newDocUrl = `https://docs.google.com/document/d/${documentId}/edit`;
      } catch (err) {
        console.error("Google Docs format-preserving failed:", err);
        newDocUrl = "";
      }
    }

    if (jobId) {
      // Sanitize tailoredSections for Supabase storage
      const sanitize = (t: string) => t.replace(/[\r\n\t]/g, " ");
      const sanitizedSections = tailoredSections.map((s: { title: string; content: string; type: string; originalIndex: number; changes: unknown[] }) => ({
        ...s,
        content: sanitize(s.content),
      }));

      await supabase.from("revisions").insert({
        job_id: jobId,
        user_id: user.id,
        revision_number: 1,
        tailored_cv_url: newDocUrl || null,
        feedback: null,
        tailored_sections: sanitizedSections,
      });

      await supabase.from("jobs").update({
        status: newDocUrl ? "done" : "failed",
        tailored_cv_url: newDocUrl,
        updated_at: new Date().toISOString(),
      }).eq("id", jobId).eq("user_id", user.id);
    }

    return NextResponse.json({ newDocUrl, title });
  } catch (error) {
    if (jobId) {
      const supabase = getServerClient();
      await supabase.from("jobs").update({ status: "failed", last_error: error instanceof Error ? error.message : "Export failed", updated_at: new Date().toISOString() }).eq("id", jobId);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 500 });
  }
}
