import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createCourse } from "@/lib/domain/courses";
import { createCourseSchema } from "@/lib/api/validation";

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
    const parsed = createCourseSchema.parse(body);
    const course = await createCourse({
      title: parsed.title,
      slug: parsed.slug,
      description: parsed.description,
      ownerId: user.id,
    });
    return NextResponse.json({ ok: true, course });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat course";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
