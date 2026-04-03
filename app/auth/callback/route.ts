import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  let response = NextResponse.redirect(new URL("/", request.url));
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(new URL("/", request.url));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  await supabase.auth.exchangeCodeForSession(code);

  // Signal to the destination page that a login just occurred
  response.cookies.set("just_logged_in", "true", { maxAge: 10, path: "/" });

  return response;
}
