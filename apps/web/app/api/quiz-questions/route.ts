import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createQuizQuestion, listQuizQuestions } from "@/lib/domain/quizzes";
import { createQuizQuestionSchema, readQueryParam } from "@/lib/api/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );

  const quizId = readQueryParam(request.url, "quizId");
  if (!quizId) {
    return NextResponse.json(
      { ok: false, error: "quizId wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const items = await listQuizQuestions({ quizId, actorId: user.id });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil quiz question";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
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
    const parsed = createQuizQuestionSchema.parse(body);
    const item = await createQuizQuestion({
      quizId: parsed.quizId,
      type: parsed.type,
      questionMarkdown: parsed.questionMarkdown,
      points: parsed.points,
      actorId: user.id,
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat quiz question";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
