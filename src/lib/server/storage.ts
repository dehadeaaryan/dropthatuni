import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export const documentsConfigured = () => !!(env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME_DOCUMENTS);
function storage() {
  if (!documentsConfigured()) error(503, 'Document storage needs an R2 documents bucket.');
  return { bucket: env.R2_BUCKET_NAME_DOCUMENTS!, client: new S3Client({ region: 'auto', endpoint: env.R2_ENDPOINT,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
    forcePathStyle: true, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED', maxAttempts: 2 }) };
}
export async function uploadObject(key: string, bytes: Uint8Array, mimeType: string) {
  const { bucket, client } = storage();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: mimeType }));
}
export async function downloadObject(key: string) {
  const { bucket, client } = storage();
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body) error(404, 'Document not found.');
  return result.Body.transformToWebStream();
}
export async function deleteObject(key: string) {
  const { bucket, client } = storage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
