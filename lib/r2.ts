import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadAudio(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: `voicenote/${key}`,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function deleteAudio(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: `voicenote/${key}`,
    })
  );
}
