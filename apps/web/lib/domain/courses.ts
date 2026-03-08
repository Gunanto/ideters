import { pool } from "@/lib/db/pool";
import { renderMarkdownToHtml } from "@/lib/content/markdown";

type ModuleActivity = {
  id: string;
  title: string;
  type: string;
  position: number;
};

type CourseModule = {
  id: string;
  title: string;
  position: number;
  activities: ModuleActivity[];
};

export async function getPublicCourses() {
  const result = await pool.query(
    `select id, title, description, status
     from courses
     where status = 'published'
     order by created_at desc`,
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
    [userId],
  );
  return result.rows;
}

export async function getOwnedCourses(userId: string) {
  const result = await pool.query(
    `select id, title, description, status
     from courses
     where owner_id = $1
     order by created_at desc`,
    [userId],
  );
  return result.rows;
}

export async function canAccessCourse(userId: string, courseId: string) {
  const result = await pool.query(
    `select exists (
      select 1
      from courses c
      left join course_members cm on cm.course_id = c.id and cm.user_id = $1
      where c.id = $2
        and (c.owner_id = $1 or cm.user_id is not null)
    ) as ok`,
    [userId, courseId],
  );
  return Boolean(result.rows[0]?.ok);
}

export async function canManageCourse(userId: string, courseId: string) {
  const result = await pool.query(
    `select exists (
      select 1
      from courses c
      left join course_members cm on cm.course_id = c.id and cm.user_id = $1
      where c.id = $2
        and (
          c.owner_id = $1
          or (cm.user_id is not null and cm.role in ('instructor', 'ta'))
        )
    ) as ok`,
    [userId, courseId],
  );
  return Boolean(result.rows[0]?.ok);
}

export async function getCourseById(courseId: string) {
  const result = await pool.query(
    `select id, title, description, status, owner_id
     from courses
     where id = $1
     limit 1`,
    [courseId],
  );
  return result.rows[0] ?? null;
}

export async function getModulesByCourseId(courseId: string) {
  const moduleResult = await pool.query(
    `select id, title, position
     from modules
     where course_id = $1
     order by position asc`,
    [courseId],
  );

  const modules: CourseModule[] = [];
  for (const module of moduleResult.rows) {
    const activitiesResult = await pool.query(
      `select id, title, type, position
       from activities
       where module_id = $1
       order by position asc`,
      [module.id],
    );
    modules.push({
      ...module,
      activities: activitiesResult.rows as ModuleActivity[],
    });
  }

  return modules;
}

export async function createCourse(input: {
  title: string;
  slug: string;
  description?: string;
  ownerId: string;
}) {
  if (!input.title || !input.slug)
    throw new Error("Judul dan slug wajib diisi.");

  const result = await pool.query(
    `insert into courses (title, slug, description, status, owner_id)
     values ($1, $2, $3, 'draft', $4)
     returning id, title, slug, description, status`,
    [input.title, input.slug, input.description ?? null, input.ownerId],
  );

  await pool.query(
    `insert into course_members (course_id, user_id, role, status)
     values ($1, $2, 'instructor', 'active')
     on conflict (course_id, user_id) do nothing`,
    [result.rows[0].id, input.ownerId],
  );

  return result.rows[0];
}

export async function createModule(input: {
  courseId: string;
  title: string;
  actorId: string;
}) {
  if (!input.courseId || !input.title)
    throw new Error("Course dan title wajib diisi.");
  const allowed = await canManageCourse(input.actorId, input.courseId);
  if (!allowed) throw new Error("Forbidden");

  const positionResult = await pool.query(
    `select coalesce(max(position), 0) + 1 as next_position from modules where course_id = $1`,
    [input.courseId],
  );

  const position = positionResult.rows[0].next_position;
  const result = await pool.query(
    `insert into modules (course_id, title, position)
     values ($1, $2, $3)
     returning id, course_id, title, position`,
    [input.courseId, input.title, position],
  );

  return result.rows[0];
}

export async function createActivity(input: {
  moduleId: string;
  type: string;
  title: string;
  contentMarkdown?: string;
  actorId: string;
}) {
  if (!input.moduleId || !input.type || !input.title) {
    throw new Error("Module, type, dan title wajib diisi.");
  }

  const moduleResult = await pool.query(
    `select id, course_id from modules where id = $1 limit 1`,
    [input.moduleId],
  );
  const module = moduleResult.rows[0];
  if (!module) throw new Error("Module tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, module.course_id);
  if (!allowed) throw new Error("Forbidden");

  const positionResult = await pool.query(
    `select coalesce(max(position), 0) + 1 as next_position from activities where module_id = $1`,
    [input.moduleId],
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
      positionResult.rows[0].next_position,
    ],
  );

  return result.rows[0];
}
