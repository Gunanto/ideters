import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createCourse } from "@/lib/domain/courses";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  try {
    const course = await createCourse({
      title: body.title,
      slug: body.slug,
      description: body.description,
      ownerId: user.id
    });
    return NextResponse.json({ ok: true, course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat course";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
