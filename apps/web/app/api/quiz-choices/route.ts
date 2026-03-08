import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createQuizChoice, listQuizChoices } from "@/lib/domain/quizzes";
import { createQuizChoiceSchema, readQueryParam } from "@/lib/api/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );

  const questionId = readQueryParam(request.url, "questionId");
  if (!questionId) {
    return NextResponse.json(
      { ok: false, error: "questionId wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const items = await listQuizChoices({ questionId, actorId: user.id });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil quiz choice";
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
    const parsed = createQuizChoiceSchema.parse(body);
    const item = await createQuizChoice({
      questionId: parsed.questionId,
      choiceText: parsed.choiceText,
      isCorrect: parsed.isCorrect,
      actorId: user.id,
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat quiz choice";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
