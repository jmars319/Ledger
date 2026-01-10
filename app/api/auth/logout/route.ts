import { NextResponse } from "next/server";

const cookieName = "ledger_admin";

const clearCookie = (response: NextResponse) => {
  response.cookies.set({
    name: cookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearCookie(response);
  return response;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearCookie(response);
  return response;
}
