import { NextResponse } from "next/server";
import { registerUser, createSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const user = await registerUser(body);
    const response = NextResponse.json({ ok: true, user });
    createSessionCookie(response, user);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat akun";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
