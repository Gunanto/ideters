import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createLearningSyntax,
  listLearningSyntaxes,
} from "@/lib/domain/learning-syntaxes";
import { createLearningSyntaxSchema } from "@/lib/api/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );

  const items = await listLearningSyntaxes();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  if (user.role !== "instructor" && user.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const body = await request.json();
  try {
    const parsed = createLearningSyntaxSchema.parse(body);
    const item = await createLearningSyntax({
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      schemaJson: parsed.schemaJson,
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat learning syntax";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
