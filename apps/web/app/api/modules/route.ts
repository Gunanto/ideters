import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createModule } from "@/lib/domain/courses";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  try {
    const module = await createModule({
      courseId: body.courseId,
      title: body.title
    });
    return NextResponse.json({ ok: true, module });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat module";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
