'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

type ModuleOption = { id: string; title: string };

export function ActivityCreateForm({ courseId, modules }: { courseId: string; modules: ModuleOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      courseId,
      moduleId: String(formData.get("moduleId") || ""),
      type: String(formData.get("type") || ""),
      title: String(formData.get("title") || ""),
      contentMarkdown: String(formData.get("contentMarkdown") || "")
    };

    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal membuat activity");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Module</label>
        <select className="input" name="moduleId" required>
          <option value="">Pilih module</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>{module.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Tipe activity</label>
        <select className="input" name="type" required>
          <option value="reading">reading</option>
          <option value="video">video</option>
          <option value="quiz">quiz</option>
          <option value="assignment">assignment</option>
          <option value="syntax_activity">syntax_activity</option>
        </select>
      </div>
      <div>
        <label className="label">Judul activity</label>
        <input className="input" name="title" required />
      </div>
      <div>
        <label className="label">Konten markdown</label>
        <textarea className="input min-h-36" name="contentMarkdown" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="button-primary" type="submit" disabled={modules.length === 0}>
        Tambah activity
      </button>
      {modules.length === 0 ? <p className="text-xs text-slate-500">Buat module terlebih dahulu.</p> : null}
    </form>
  );
}
