import { CourseCreateForm } from "@/components/forms/course-create-form";

export default function NewCoursePage() {
  return (
    <main className="container-page py-10">
      <div className="mx-auto max-w-2xl card p-6">
        <h1 className="text-2xl font-bold">Buat Course</h1>
        <p className="mt-2 text-slate-600">Membuat course baru untuk instructor area.</p>
        <div className="mt-6">
          <CourseCreateForm />
        </div>
      </div>
    </main>
  );
}
