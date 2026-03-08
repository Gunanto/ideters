import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi."),
  slug: z.string().trim().min(1, "Slug wajib diisi."),
  description: z.string().optional()
});

export const createModuleSchema = z.object({
  courseId: z.string().uuid("courseId tidak valid."),
  title: z.string().trim().min(1, "Judul module wajib diisi.")
});

export const createActivitySchema = z.object({
  moduleId: z.string().uuid("moduleId tidak valid."),
  type: z.string().trim().min(1, "Type wajib diisi."),
  title: z.string().trim().min(1, "Judul activity wajib diisi."),
  contentMarkdown: z.string().optional()
});

export const createLearningSyntaxSchema = z.object({
  name: z.string().trim().min(1, "Name wajib diisi."),
  slug: z.string().trim().min(1, "Slug wajib diisi."),
  description: z.string().optional(),
  schemaJson: z.unknown().optional()
});

export const updateLearningSyntaxSchema = createLearningSyntaxSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Payload tidak boleh kosong." });

export const createQuizSchema = z.object({
  activityId: z.string().uuid("activityId tidak valid."),
  title: z.string().trim().min(1, "Title quiz wajib diisi."),
  timeLimitMinutes: z.number().int().positive().optional(),
  maxAttempts: z.number().int().positive().optional(),
  passingScore: z.number().min(0).max(100).optional()
});

export const updateQuizSchema = createQuizSchema
  .omit({ activityId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Payload tidak boleh kosong." });

export const createQuizQuestionSchema = z.object({
  quizId: z.string().uuid("quizId tidak valid."),
  type: z.string().trim().min(1, "Type wajib diisi."),
  questionMarkdown: z.string().trim().min(1, "Question wajib diisi."),
  points: z.number().positive().optional()
});

export const updateQuizQuestionSchema = createQuizQuestionSchema
  .omit({ quizId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Payload tidak boleh kosong." });

export const createQuizChoiceSchema = z.object({
  questionId: z.string().uuid("questionId tidak valid."),
  choiceText: z.string().trim().min(1, "Choice text wajib diisi."),
  isCorrect: z.boolean().optional()
});

export const updateQuizChoiceSchema = createQuizChoiceSchema
  .omit({ questionId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Payload tidak boleh kosong." });

export function readQueryParam(url: string, key: string) {
  const value = new URL(url).searchParams.get(key);
  return (value || "").trim();
}
