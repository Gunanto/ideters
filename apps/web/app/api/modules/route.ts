import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createModule } from "@/lib/domain/courses";
import { createModuleSchema } from "@/lib/api/validation";

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
    const parsed = createModuleSchema.parse(body);
    const module = await createModule({
      courseId: parsed.courseId,
      title: parsed.title,
      actorId: user.id,
    });
    return NextResponse.json({ ok: true, module });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat module";
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
