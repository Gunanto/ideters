import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createQuiz, listQuizzesByActivity } from "@/lib/domain/quizzes";
import { createQuizSchema, readQueryParam } from "@/lib/api/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );

  const activityId = readQueryParam(request.url, "activityId");
  if (!activityId) {
    return NextResponse.json(
      { ok: false, error: "activityId wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const items = await listQuizzesByActivity({ activityId, actorId: user.id });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil quiz";
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
    const parsed = createQuizSchema.parse(body);
    const quiz = await createQuiz({
      activityId: parsed.activityId,
      title: parsed.title,
      timeLimitMinutes: parsed.timeLimitMinutes,
      maxAttempts: parsed.maxAttempts,
      passingScore: parsed.passingScore,
      actorId: user.id,
    });
    return NextResponse.json({ ok: true, quiz });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat quiz";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
