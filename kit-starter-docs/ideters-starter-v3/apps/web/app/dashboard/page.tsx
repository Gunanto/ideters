import { getCurrentUser } from "@/lib/auth/session";
import { getUserCourses } from "@/lib/domain/courses";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const courses = await getUserCourses(user.id);

  return (
    <main className="container-page py-10 space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-600">Halo, {user.full_name}. Role Anda: {user.role}</p>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">My Courses</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-medium">{course.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{course.description ?? "Tanpa deskripsi"}</p>
              <p className="mt-3 text-xs text-slate-400">Status: {course.status}</p>
            </div>
          ))}
          {courses.length === 0 && <p className="text-sm text-slate-500">Belum ada course.</p>}
        </div>
      </div>
    </main>
  );
}
