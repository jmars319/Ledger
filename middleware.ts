import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const cookieName = "ledger_admin";

export function middleware(request: NextRequest) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: "ADMIN_TOKEN is not configured." }, { status: 500 });
  }

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/logout") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/github/install") ||
    pathname.startsWith("/api/github/callback")
  ) {
    return NextResponse.next();
  }

  const token = request.headers.get("x-admin-token") ?? request.nextUrl.searchParams.get("token");
  const hasCookie = request.cookies.get(cookieName)?.value === "1";
  const isAuthed = token === adminToken || hasCookie;

  if (!isAuthed) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.delete("token");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
