import { NextResponse } from "next/server";

const cookieName = "ledger_admin";

const getTokenFromRequest = async (request: Request) => {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    return typeof body?.token === "string" ? body.token : "";
  }

  const formData = await request.formData().catch(() => null);
  const token = formData?.get("token");
  return typeof token === "string" ? token : "";
};

export async function POST(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: "ADMIN_TOKEN is not configured." }, { status: 500 });
  }

  const token = await getTokenFromRequest(request);
  if (token !== adminToken) {
    const url = new URL("/login?error=1", request.url);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set({
    name: cookieName,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
