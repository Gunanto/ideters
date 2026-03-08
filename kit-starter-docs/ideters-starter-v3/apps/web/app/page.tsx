import Link from "next/link";
import { getPublicCourses } from "@/lib/domain/courses";
import { MarkdownContent } from "@/components/content/markdown-content";

export default async function HomePage() {
  const courses = await getPublicCourses();

  return (
    <main className="container-page py-10">
      <section className="card grid gap-8 p-8 lg:grid-cols-2">
        <div className="space-y-5">
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            ideters starter v3
          </span>
          <h1 className="text-4xl font-bold tracking-tight">LMS modular berbasis syntax pembelajaran.</h1>
          <p className="text-lg text-slate-600">
            Starter ini sudah memiliki auth sederhana, dashboard, CRUD dasar,
            markdown + LaTeX, dan upload endpoint ke MinIO.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="button-primary" href="/dashboard">Buka dashboard</Link>
            <Link className="button-secondary" href="/author">Instructor area</Link>
            <Link className="button-secondary" href="/login">Login</Link>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-xl font-semibold">Contoh materi</h2>
          <MarkdownContent markdown={"## Persamaan Kuadrat\n\nRumus diskriminan: $$D = b^2 - 4ac$$"} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-semibold">Published Courses</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="card p-5">
              <h3 className="text-lg font-semibold">{course.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{course.description ?? "Tanpa deskripsi"}</p>
              <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">{course.status}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
