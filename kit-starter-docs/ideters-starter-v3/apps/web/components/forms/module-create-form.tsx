'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ModuleCreateForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      courseId,
      title: String(formData.get("title") || "")
    };

    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal membuat module");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Judul module</label>
        <input className="input" name="title" required />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="button-primary" type="submit">Tambah module</button>
    </form>
  );
}
