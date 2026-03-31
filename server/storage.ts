/**
 * S3 file storage helpers using the AWS SDK directly.
 * Configure via: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function getS3Client(): S3Client {
  return new S3Client({
    region: ENV.awsRegion,
    credentials: {
      accessKeyId: ENV.awsAccessKeyId,
      secretAccessKey: ENV.awsSecretAccessKey,
    },
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!ENV.awsAccessKeyId || !ENV.awsS3Bucket) {
    throw new Error(
      "S3 credentials missing: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET"
    );
  }
  const key = normalizeKey(relKey);
  const client = getS3Client();
  await client.send(new PutObjectCommand({
    Bucket: ENV.awsS3Bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
  }));
  const url = `https://${ENV.awsS3Bucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;
  return { key, url };
}

export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  if (!ENV.awsAccessKeyId || !ENV.awsS3Bucket) {
    throw new Error("S3 credentials missing");
  }
  const key = normalizeKey(relKey);
  const client = getS3Client();
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.awsS3Bucket, Key: key }),
    { expiresIn }
  );
  return { key, url };
}
