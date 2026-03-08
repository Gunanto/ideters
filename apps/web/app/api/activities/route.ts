import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createActivity } from "@/lib/domain/courses";
import { createActivitySchema } from "@/lib/api/validation";

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
    const parsed = createActivitySchema.parse(body);
    const activity = await createActivity({
      moduleId: parsed.moduleId,
      type: parsed.type,
      title: parsed.title,
      contentMarkdown: parsed.contentMarkdown ?? "",
      actorId: user.id,
    });
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat activity";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
