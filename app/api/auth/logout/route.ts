import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
        },
      },
    }
  );

  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url), 302);

  // Explicitly clear all Supabase auth cookies
  const cookieOptions = { path: "/", expires: new Date(0), sameSite: "lax" as const };
  response.cookies.set("sb-access-token", "", cookieOptions);
  response.cookies.set("sb-refresh-token", "", cookieOptions);
  response.cookies.set("supabase-auth-token", "", cookieOptions);

  return response;
}
