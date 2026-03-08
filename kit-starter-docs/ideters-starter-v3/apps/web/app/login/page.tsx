import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <main className="container-page py-16">
      <div className="mx-auto max-w-md card p-8">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Gunakan demo account dari README atau buat akun baru.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
