import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <main className="container-page py-16">
      <div className="mx-auto max-w-md card p-8">
        <h1 className="text-2xl font-bold">Register</h1>
        <p className="mt-2 text-sm text-slate-600">Membuat akun student baru untuk development lokal.</p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
