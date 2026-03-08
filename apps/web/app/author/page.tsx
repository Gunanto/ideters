import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnedCourses } from "@/lib/domain/courses";
import { redirect } from "next/navigation";

export default async function AuthorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const courses = await getOwnedCourses(user.id);

  return (
    <main className="container-page py-10 space-y-6">
      <div className="card p-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Instructor Area</h1>
          <p className="mt-2 text-slate-600">Kelola course, module, dan activity dari sini.</p>
        </div>
        <Link className="button-primary" href="/author/courses/new">Buat Course</Link>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">My Courses</h2>
        <div className="mt-4 space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">{course.title}</h3>
                  <p className="text-sm text-slate-600">{course.description ?? "Tanpa deskripsi"}</p>
                </div>
                <Link className="button-secondary" href={`/author/courses/${course.id}`}>Kelola</Link>
              </div>
            </div>
          ))}
          {courses.length === 0 && <p className="text-sm text-slate-500">Belum ada course yang Anda miliki.</p>}
        </div>
      </div>
    </main>
  );
}
