import { NextResponse } from "next/server";
import { putObjectToCourseAssets } from "@/lib/storage/minio";
import { getCurrentUser } from "@/lib/auth/session";

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

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "File tidak ditemukan" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const key = `uploads/${Date.now()}-${file.name}`;

  await putObjectToCourseAssets(
    key,
    buffer,
    file.type || "application/octet-stream",
  );

  return NextResponse.json({ ok: true, key });
}
