import { notFound } from "next/navigation";
import { getCourseById, getModulesByCourseId } from "@/lib/domain/courses";
import { ModuleCreateForm } from "@/components/forms/module-create-form";
import { ActivityCreateForm } from "@/components/forms/activity-create-form";

export default async function CourseManagePage({ params }: { params: { courseId: string } }) {
  const course = await getCourseById(params.courseId);
  if (!course) notFound();

  const modules = await getModulesByCourseId(course.id);

  return (
    <main className="container-page py-10 space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="mt-2 text-slate-600">{course.description ?? "Tanpa deskripsi"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Tambah Module</h2>
          <div className="mt-4">
            <ModuleCreateForm courseId={course.id} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Tambah Activity</h2>
          <div className="mt-4">
            <ActivityCreateForm courseId={course.id} modules={modules.map((m) => ({ id: m.id, title: m.title }))} />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">Modules</h2>
        <div className="mt-4 space-y-4">
          {modules.map((module) => (
            <div key={module.id} className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-medium">{module.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {module.activities.map((activity) => (
                  <li key={activity.id}>
                    {activity.title} <span className="text-slate-400">({activity.type})</span>
                  </li>
                ))}
                {module.activities.length === 0 && <li>Belum ada activity.</li>}
              </ul>
            </div>
          ))}
          {modules.length === 0 && <p className="text-sm text-slate-500">Belum ada module.</p>}
        </div>
      </div>
    </main>
  );
}
