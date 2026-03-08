import { NextResponse } from "next/server";
import { authenticateUser, createSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();
  const user = await authenticateUser(body.email, body.password);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Email atau password salah." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user });
  createSessionCookie(response, user);
  return response;
}
