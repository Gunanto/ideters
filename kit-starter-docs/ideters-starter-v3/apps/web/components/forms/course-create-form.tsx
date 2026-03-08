'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CourseCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") || ""),
      slug: String(formData.get("slug") || ""),
      description: String(formData.get("description") || "")
    };

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Gagal membuat course");
      return;
    }

    router.push(`/author/courses/${json.course.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Judul</label>
        <input className="input" name="title" required />
      </div>
      <div>
        <label className="label">Slug</label>
        <input className="input" name="slug" required />
      </div>
      <div>
        <label className="label">Deskripsi</label>
        <textarea className="input min-h-28" name="description" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="button-primary" type="submit">Simpan course</button>
    </form>
  );
}
