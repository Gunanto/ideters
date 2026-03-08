import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteQuizQuestion, updateQuizQuestion } from "@/lib/domain/quizzes";
import { updateQuizQuestionSchema } from "@/lib/api/validation";

type Ctx = { params: { questionId: string } };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "instructor" && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateQuizQuestionSchema.parse(body);
    const item = await updateQuizQuestion({
      questionId: params.questionId,
      type: parsed.type,
      questionMarkdown: parsed.questionMarkdown,
      points: parsed.points,
      actorId: user.id
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update quiz question";
    const status =
      message === "Forbidden" ? 403 : message === "Question tidak ditemukan." ? 404 : 400;
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
    await deleteQuizQuestion({ questionId: params.questionId, actorId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal hapus quiz question";
    const status =
      message === "Forbidden" ? 403 : message === "Question tidak ditemukan." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
