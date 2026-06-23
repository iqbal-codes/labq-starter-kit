import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@admin-template/env/server";

let client: S3Client | null = null;
let bucketReadyPromise: Promise<void> | null = null;

export const S3_BUCKET = env.S3_BUCKET;

export function getS3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export async function ensureS3BucketExists() {
  if (!bucketReadyPromise) {
    bucketReadyPromise = (async () => {
      const s3 = getS3Client();
      try {
        await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const code =
          typeof error === "object" &&
          error !== null &&
          "Code" in error &&
          typeof error.Code === "string"
            ? error.Code
            : null;

        const shouldCreate =
          code === "NoSuchBucket" ||
          message.includes("NotFound") ||
          message.includes("NoSuchBucket") ||
          message.includes("404");

        if (!shouldCreate) {
          bucketReadyPromise = null;
          throw error;
        }

        await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
      }
    })();
  }

  await bucketReadyPromise;
}
