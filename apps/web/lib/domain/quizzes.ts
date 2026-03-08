import { pool } from "@/lib/db/pool";
import { canAccessCourse, canManageCourse } from "@/lib/domain/courses";
import { renderMarkdownToHtml } from "@/lib/content/markdown";

async function getActivityContext(activityId: string) {
  const result = await pool.query(
    `select a.id as activity_id, a.title as activity_title, m.id as module_id, m.course_id
     from activities a
     join modules m on m.id = a.module_id
     where a.id = $1
     limit 1`,
    [activityId],
  );
  return result.rows[0] ?? null;
}

async function getQuizContext(quizId: string) {
  const result = await pool.query(
    `select q.id as quiz_id, q.activity_id, m.course_id
     from quizzes q
     join activities a on a.id = q.activity_id
     join modules m on m.id = a.module_id
     where q.id = $1
     limit 1`,
    [quizId],
  );
  return result.rows[0] ?? null;
}

async function getQuestionContext(questionId: string) {
  const result = await pool.query(
    `select qq.id as question_id, q.id as quiz_id, m.course_id
     from quiz_questions qq
     join quizzes q on q.id = qq.quiz_id
     join activities a on a.id = q.activity_id
     join modules m on m.id = a.module_id
     where qq.id = $1
     limit 1`,
    [questionId],
  );
  return result.rows[0] ?? null;
}

async function getChoiceContext(choiceId: string) {
  const result = await pool.query(
    `select qc.id as choice_id, qq.id as question_id, q.id as quiz_id, m.course_id
     from quiz_choices qc
     join quiz_questions qq on qq.id = qc.question_id
     join quizzes q on q.id = qq.quiz_id
     join activities a on a.id = q.activity_id
     join modules m on m.id = a.module_id
     where qc.id = $1
     limit 1`,
    [choiceId],
  );
  return result.rows[0] ?? null;
}

export async function listQuizzesByActivity(input: {
  activityId: string;
  actorId: string;
}) {
  const ctx = await getActivityContext(input.activityId);
  if (!ctx) throw new Error("Activity tidak ditemukan.");

  const allowed = await canAccessCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  const result = await pool.query(
    `select id, activity_id, title, time_limit_minutes, max_attempts, passing_score
     from quizzes
     where activity_id = $1
     order by id asc`,
    [input.activityId],
  );

  return result.rows;
}

export async function createQuiz(input: {
  activityId: string;
  title: string;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  passingScore?: number;
  actorId: string;
}) {
  const ctx = await getActivityContext(input.activityId);
  if (!ctx) throw new Error("Activity tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  const title = String(input.title || "").trim();
  if (!title) throw new Error("Title quiz wajib diisi.");

  const result = await pool.query(
    `insert into quizzes (activity_id, title, time_limit_minutes, max_attempts, passing_score)
     values ($1, $2, $3, $4, $5)
     returning id, activity_id, title, time_limit_minutes, max_attempts, passing_score`,
    [
      input.activityId,
      title,
      input.timeLimitMinutes ?? null,
      input.maxAttempts ?? 1,
      input.passingScore ?? null,
    ],
  );

  return result.rows[0];
}

export async function updateQuiz(input: {
  quizId: string;
  title?: string;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  passingScore?: number;
  actorId: string;
}) {
  const ctx = await getQuizContext(input.quizId);
  if (!ctx) throw new Error("Quiz tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  const result = await pool.query(
    `update quizzes
     set
       title = coalesce($2, title),
       time_limit_minutes = coalesce($3, time_limit_minutes),
       max_attempts = coalesce($4, max_attempts),
       passing_score = coalesce($5, passing_score)
     where id = $1
     returning id, activity_id, title, time_limit_minutes, max_attempts, passing_score`,
    [
      input.quizId,
      input.title ? String(input.title).trim() : null,
      input.timeLimitMinutes ?? null,
      input.maxAttempts ?? null,
      input.passingScore ?? null,
    ],
  );

  return result.rows[0];
}

export async function deleteQuiz(input: { quizId: string; actorId: string }) {
  const ctx = await getQuizContext(input.quizId);
  if (!ctx) throw new Error("Quiz tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  await pool.query(`delete from quizzes where id = $1`, [input.quizId]);
}

export async function listQuizQuestions(input: {
  quizId: string;
  actorId: string;
}) {
  const ctx = await getQuizContext(input.quizId);
  if (!ctx) throw new Error("Quiz tidak ditemukan.");

  const allowed = await canAccessCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  const result = await pool.query(
    `select id, quiz_id, type, question_markdown, question_html, points, position
     from quiz_questions
     where quiz_id = $1
     order by position asc`,
    [input.quizId],
  );
  return result.rows;
}

export async function createQuizQuestion(input: {
  quizId: string;
  type: string;
  questionMarkdown: string;
  points?: number;
  actorId: string;
}) {
  const ctx = await getQuizContext(input.quizId);
  if (!ctx) throw new Error("Quiz tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  const questionMarkdown = String(input.questionMarkdown || "").trim();
  const type = String(input.type || "").trim();
  if (!type || !questionMarkdown)
    throw new Error("Type dan question wajib diisi.");

  const positionResult = await pool.query(
    `select coalesce(max(position), 0) + 1 as next_position from quiz_questions where quiz_id = $1`,
    [input.quizId],
  );
  const questionHtml = await renderMarkdownToHtml(questionMarkdown);

  const result = await pool.query(
    `insert into quiz_questions (quiz_id, type, question_markdown, question_html, points, position)
     values ($1, $2, $3, $4, $5, $6)
     returning id, quiz_id, type, question_markdown, question_html, points, position`,
    [
      input.quizId,
      type,
      questionMarkdown,
      questionHtml,
      input.points ?? 1,
      positionResult.rows[0].next_position,
    ],
  );

  return result.rows[0];
}

export async function updateQuizQuestion(input: {
  questionId: string;
  type?: string;
  questionMarkdown?: string;
  points?: number;
  actorId: string;
}) {
  const ctx = await getQuestionContext(input.questionId);
  if (!ctx) throw new Error("Question tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  const questionMarkdown = input.questionMarkdown?.trim();
  const questionHtml = questionMarkdown
    ? await renderMarkdownToHtml(questionMarkdown)
    : null;

  const result = await pool.query(
    `update quiz_questions
     set
       type = coalesce($2, type),
       question_markdown = coalesce($3, question_markdown),
       question_html = coalesce($4, question_html),
       points = coalesce($5, points)
     where id = $1
     returning id, quiz_id, type, question_markdown, question_html, points, position`,
    [
      input.questionId,
      input.type ? String(input.type).trim() : null,
      questionMarkdown ?? null,
      questionHtml,
      input.points ?? null,
    ],
  );

  return result.rows[0];
}

export async function deleteQuizQuestion(input: {
  questionId: string;
  actorId: string;
}) {
  const ctx = await getQuestionContext(input.questionId);
  if (!ctx) throw new Error("Question tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  await pool.query(`delete from quiz_questions where id = $1`, [
    input.questionId,
  ]);
}

export async function listQuizChoices(input: {
  questionId: string;
  actorId: string;
}) {
  const ctx = await getQuestionContext(input.questionId);
  if (!ctx) throw new Error("Question tidak ditemukan.");

  const allowed = await canAccessCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  const result = await pool.query(
    `select id, question_id, choice_text, is_correct, position
     from quiz_choices
     where question_id = $1
     order by position asc`,
    [input.questionId],
  );
  return result.rows;
}

export async function createQuizChoice(input: {
  questionId: string;
  choiceText: string;
  isCorrect?: boolean;
  actorId: string;
}) {
  const ctx = await getQuestionContext(input.questionId);
  if (!ctx) throw new Error("Question tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  const choiceText = String(input.choiceText || "").trim();
  if (!choiceText) throw new Error("Choice text wajib diisi.");

  const positionResult = await pool.query(
    `select coalesce(max(position), 0) + 1 as next_position from quiz_choices where question_id = $1`,
    [input.questionId],
  );

  const result = await pool.query(
    `insert into quiz_choices (question_id, choice_text, is_correct, position)
     values ($1, $2, $3, $4)
     returning id, question_id, choice_text, is_correct, position`,
    [
      input.questionId,
      choiceText,
      Boolean(input.isCorrect),
      positionResult.rows[0].next_position,
    ],
  );

  return result.rows[0];
}

export async function updateQuizChoice(input: {
  choiceId: string;
  choiceText?: string;
  isCorrect?: boolean;
  actorId: string;
}) {
  const ctx = await getChoiceContext(input.choiceId);
  if (!ctx) throw new Error("Choice tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  const result = await pool.query(
    `update quiz_choices
     set
       choice_text = coalesce($2, choice_text),
       is_correct = coalesce($3, is_correct)
     where id = $1
     returning id, question_id, choice_text, is_correct, position`,
    [input.choiceId, input.choiceText?.trim() ?? null, input.isCorrect ?? null],
  );

  return result.rows[0];
}

export async function deleteQuizChoice(input: {
  choiceId: string;
  actorId: string;
}) {
  const ctx = await getChoiceContext(input.choiceId);
  if (!ctx) throw new Error("Choice tidak ditemukan.");

  const allowed = await canManageCourse(input.actorId, ctx.course_id);
  if (!allowed) throw new Error("Forbidden");

  await pool.query(`delete from quiz_choices where id = $1`, [input.choiceId]);
}
