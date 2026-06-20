import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/src/server/auth";

export async function POST(request: Request) {
  const signOutResponse = await auth.api.signOut({
    headers: await headers(),
    asResponse: true,
  });
  const response = NextResponse.redirect(new URL("/login", request.url));

  const setCookies =
    "getSetCookie" in signOutResponse.headers
      ? signOutResponse.headers.getSetCookie()
      : [];

  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}
