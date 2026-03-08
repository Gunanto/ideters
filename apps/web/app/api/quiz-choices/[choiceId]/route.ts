import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteQuizChoice, updateQuizChoice } from "@/lib/domain/quizzes";
import { updateQuizChoiceSchema } from "@/lib/api/validation";

type Ctx = { params: { choiceId: string } };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "instructor" && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateQuizChoiceSchema.parse(body);
    const item = await updateQuizChoice({
      choiceId: params.choiceId,
      choiceText: parsed.choiceText,
      isCorrect: parsed.isCorrect,
      actorId: user.id
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update quiz choice";
    const status =
      message === "Forbidden" ? 403 : message === "Choice tidak ditemukan." ? 404 : 400;
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
    await deleteQuizChoice({ choiceId: params.choiceId, actorId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal hapus quiz choice";
    const status =
      message === "Forbidden" ? 403 : message === "Choice tidak ditemukan." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
