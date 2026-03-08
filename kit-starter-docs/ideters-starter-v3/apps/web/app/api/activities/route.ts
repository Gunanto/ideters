import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createActivity } from "@/lib/domain/courses";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  try {
    const activity = await createActivity({
      moduleId: body.moduleId,
      type: body.type,
      title: body.title,
      contentMarkdown: body.contentMarkdown ?? ""
    });
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat activity";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
