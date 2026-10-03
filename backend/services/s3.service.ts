import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { API_CONFIG } from "@config/api-endpoints.js";
import { createHash } from "crypto";

type S3Config = {
  client: S3Client;
  bucket: string;
  region: string;
};

/**
 * Uploads the image and returns its public URL. The key is a content hash, so the same
 * image always gets the same URL. Pass a `namespace` to get a different URL for the same image.
 */
export async function getTemporaryUrl(
  data: Buffer,
  mimeType: string = "",
  namespace: string = ""
): Promise<string> {
  const { client, bucket, region } = getS3Config();
  const fileKey = createHash("sha256")
    .update(data)
    .update(namespace)
    .digest("hex");

  try {
    await uploadToS3(client, bucket, fileKey, data, mimeType);
    return buildS3Url(bucket, region, fileKey);
  } catch (error) {
    handleS3Error(error, fileKey, bucket);
    throw error;
  }
}

async function uploadToS3(
  client: S3Client,
  bucket: string,
  key: string,
  data: Buffer,
  mimeType: string
): Promise<void> {
  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: mimeType,
  };
  console.log(`🚀 Uploading to S3: ${bucket}`);
  await client.send(new PutObjectCommand(uploadParams));
}

function buildS3Url(bucket: string, region: string, key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function handleS3Error(error: unknown, key: string, bucket: string): void {
  console.error(`❌ S3 Upload failed for "${key}":`, error);

  if (isAwsError(error)) {
    const errorMessages = {
      InvalidAccessKeyId: "🔑 AWS Access Key ID is invalid",
      SignatureDoesNotMatch: "🔐 AWS Secret Key is invalid",
      NoSuchBucket: `🪣 Bucket '${bucket}' doesn't exist`,
    };

    const message = errorMessages[error.name as keyof typeof errorMessages];
    if (message) console.error(`🚨 ${message}`);
  }
}

function isAwsError(error: unknown): error is { name: string } {
  return Boolean(error && typeof error === "object" && "name" in error);
}

const getS3Config = (() => {
  let config: S3Config | undefined;

  return (): S3Config => {
    if (!config) {
      const { AWS_S3 } = API_CONFIG;
      const { BUCKET_REGION, ACCESS_KEY, SECRET_KEY, BUCKET_NAME } = AWS_S3;

      config = {
        client: new S3Client({
          region: BUCKET_REGION,
          credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
        }),
        bucket: BUCKET_NAME,
        region: BUCKET_REGION,
      };
    }
    return config;
  };
})();
