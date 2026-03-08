'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") || ""),
      fullName: String(formData.get("fullName") || ""),
      password: String(formData.get("password") || "")
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Register gagal");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Nama lengkap</label>
        <input className="input" type="text" name="fullName" required />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" name="email" required />
      </div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" name="password" minLength={8} required />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="button-primary w-full" disabled={loading} type="submit">
        {loading ? "Memproses..." : "Buat akun"}
      </button>
    </form>
  );
}
