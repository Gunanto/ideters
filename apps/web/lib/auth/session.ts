import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/pool";
import { env } from "@/lib/config/env";

type SessionUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

function signSessionPayload(payload: string) {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("hex");
}

function encodeSession(user: SessionUser) {
  const payload = JSON.stringify(user);
  const signature = signSessionPayload(payload);
  return Buffer.from(JSON.stringify({ payload, signature })).toString(
    "base64url",
  );
}

function decodeSession(value: string): SessionUser | null {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as {
      payload: string;
      signature: string;
    };
    const expected = signSessionPayload(parsed.payload);

    const a = Buffer.from(parsed.signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    return JSON.parse(parsed.payload) as SessionUser;
  } catch {
    return null;
  }
}

export function createSessionCookie(response: NextResponse, user: SessionUser) {
  response.cookies.set("ideters_session", encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const value = cookieStore.get("ideters_session")?.value;
  if (!value) return null;
  return decodeSession(value);
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail || !password) return null;

  const result = await pool.query(
    `select id, email, full_name, role, password_hash from users where email = $1 limit 1`,
    [normalizedEmail],
  );

  const user = result.rows[0];
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };
}

export async function registerUser(input: {
  email?: string;
  fullName?: string;
  password?: string;
}) {
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  const fullName = String(input.fullName || "").trim();
  const password = String(input.password || "");

  if (!email || !fullName || password.length < 8) {
    throw new Error("Data register tidak valid.");
  }

  const existing = await pool.query(
    `select id from users where email = $1 limit 1`,
    [email],
  );
  if (existing.rowCount) throw new Error("Email sudah terdaftar.");

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `insert into users (email, full_name, password_hash, role)
     values ($1, $2, $3, 'student')
     returning id, email, full_name, role`,
    [email, fullName, passwordHash],
  );

  return result.rows[0] as SessionUser;
}
