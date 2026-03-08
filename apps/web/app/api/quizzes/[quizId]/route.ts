import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteQuiz, updateQuiz } from "@/lib/domain/quizzes";
import { updateQuizSchema } from "@/lib/api/validation";

type Ctx = { params: { quizId: string } };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== "instructor" && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateQuizSchema.parse(body);
    const quiz = await updateQuiz({
      quizId: params.quizId,
      title: parsed.title,
      timeLimitMinutes: parsed.timeLimitMinutes,
      maxAttempts: parsed.maxAttempts,
      passingScore: parsed.passingScore,
      actorId: user.id
    });
    return NextResponse.json({ ok: true, quiz });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update quiz";
    const status =
      message === "Forbidden" ? 403 : message === "Quiz tidak ditemukan." ? 404 : 400;
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
    await deleteQuiz({ quizId: params.quizId, actorId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal hapus quiz";
    const status =
      message === "Forbidden" ? 403 : message === "Quiz tidak ditemukan." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
