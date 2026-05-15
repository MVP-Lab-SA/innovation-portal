import { put, del, list, type PutBlobResult } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(
  filename: string,
  file: File | Blob | Buffer,
  options?: { folder?: string; contentType?: string }
): Promise<PutBlobResult> {
  const path = options?.folder ? `${options.folder}/${filename}` : filename;
  
  return await put(path, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: options?.contentType,
  });
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

/**
 * List files in Vercel Blob storage
 */
export async function listFiles(prefix?: string) {
  return await list({ prefix });
}

/**
 * Check if Blob storage is configured
 */
export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
