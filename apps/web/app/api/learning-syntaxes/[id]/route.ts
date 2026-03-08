import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteLearningSyntax, updateLearningSyntax } from "@/lib/domain/learning-syntaxes";
import { updateLearningSyntaxSchema } from "@/lib/api/validation";

type Ctx = { params: { id: string } };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "instructor" && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateLearningSyntaxSchema.parse(body);
    const item = await updateLearningSyntax(params.id, {
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      schemaJson: parsed.schemaJson
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update learning syntax";
    const status = message === "Learning syntax tidak ditemukan." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "instructor" && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await deleteLearningSyntax(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal hapus learning syntax";
    const status = message === "Learning syntax tidak ditemukan." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
