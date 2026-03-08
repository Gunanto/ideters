import { pool } from "@/lib/db/pool";
import { renderMarkdownToHtml } from "@/lib/content/markdown";

export async function getPublicCourses() {
  const result = await pool.query(
    `select id, title, description, status
     from courses
     where status = 'published'
     order by created_at desc`
  );
  return result.rows;
}

export async function getUserCourses(userId: string) {
  const result = await pool.query(
    `select c.id, c.title, c.description, c.status
     from course_members cm
     join courses c on c.id = cm.course_id
     where cm.user_id = $1
     order by c.created_at desc`,
    [userId]
  );
  return result.rows;
}

export async function getOwnedCourses(userId: string) {
  const result = await pool.query(
    `select id, title, description, status
     from courses
     where owner_id = $1
     order by created_at desc`,
    [userId]
  );
  return result.rows;
}

export async function getCourseById(courseId: string) {
  const result = await pool.query(
    `select id, title, description, status, owner_id
     from courses
     where id = $1
     limit 1`,
    [courseId]
  );
  return result.rows[0] ?? null;
}

export async function getModulesByCourseId(courseId: string) {
  const moduleResult = await pool.query(
    `select id, title, position
     from modules
     where course_id = $1
     order by position asc`,
    [courseId]
  );

  const modules = [];
  for (const module of moduleResult.rows) {
    const activitiesResult = await pool.query(
      `select id, title, type, position
       from activities
       where module_id = $1
       order by position asc`,
      [module.id]
    );
    modules.push({ ...module, activities: activitiesResult.rows });
  }

  return modules;
}

export async function createCourse(input: { title: string; slug: string; description?: string; ownerId: string }) {
  if (!input.title || !input.slug) throw new Error("Judul dan slug wajib diisi.");

  const result = await pool.query(
    `insert into courses (title, slug, description, status, owner_id)
     values ($1, $2, $3, 'draft', $4)
     returning id, title, slug, description, status`,
    [input.title, input.slug, input.description ?? null, input.ownerId]
  );

  await pool.query(
    `insert into course_members (course_id, user_id, role, status)
     values ($1, $2, 'instructor', 'active')
     on conflict (course_id, user_id) do nothing`,
    [result.rows[0].id, input.ownerId]
  );

  return result.rows[0];
}

export async function createModule(input: { courseId: string; title: string }) {
  if (!input.courseId || !input.title) throw new Error("Course dan title wajib diisi.");

  const positionResult = await pool.query(
    `select coalesce(max(position), 0) + 1 as next_position from modules where course_id = $1`,
    [input.courseId]
  );

  const position = positionResult.rows[0].next_position;
  const result = await pool.query(
    `insert into modules (course_id, title, position)
     values ($1, $2, $3)
     returning id, course_id, title, position`,
    [input.courseId, input.title, position]
  );

  return result.rows[0];
}

export async function createActivity(input: {
  moduleId: string;
  type: string;
  title: string;
  contentMarkdown?: string;
}) {
  if (!input.moduleId || !input.type || !input.title) {
    throw new Error("Module, type, dan title wajib diisi.");
  }

  const positionResult = await pool.query(
    `select coalesce(max(position), 0) + 1 as next_position from activities where module_id = $1`,
    [input.moduleId]
  );

  const contentHtml = input.contentMarkdown
    ? await renderMarkdownToHtml(input.contentMarkdown)
    : null;

  const result = await pool.query(
    `insert into activities (module_id, type, title, content_markdown, content_html, position, is_published)
     values ($1, $2, $3, $4, $5, $6, false)
     returning id, module_id, type, title, position`,
    [
      input.moduleId,
      input.type,
      input.title,
      input.contentMarkdown ?? null,
      contentHtml,
      positionResult.rows[0].next_position
    ]
  );

  return result.rows[0];
}
