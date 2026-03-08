import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/config/env";

const client = new S3Client({
  region: env.MINIO_REGION,
  endpoint: env.MINIO_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.MINIO_ROOT_USER,
    secretAccessKey: env.MINIO_ROOT_PASSWORD
  }
});

export async function putObjectToCourseAssets(key: string, body: Buffer, contentType: string) {
  await client.send(
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET_COURSE_ASSETS,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );
}
