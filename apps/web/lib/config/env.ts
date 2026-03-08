import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string(),
  SESSION_SECRET: z.string().min(10),
  APP_URL: z.string().default("http://localhost:3000"),
  MINIO_ENDPOINT: z.string(),
  MINIO_REGION: z.string().default("us-east-1"),
  MINIO_ROOT_USER: z.string(),
  MINIO_ROOT_PASSWORD: z.string(),
  MINIO_BUCKET_COURSE_ASSETS: z.string().default("course-assets")
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_URL: process.env.APP_URL,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
  MINIO_REGION: process.env.MINIO_REGION,
  MINIO_ROOT_USER: process.env.MINIO_ROOT_USER,
  MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD,
  MINIO_BUCKET_COURSE_ASSETS: process.env.MINIO_BUCKET_COURSE_ASSETS
});
