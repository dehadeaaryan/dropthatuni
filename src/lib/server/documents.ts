import { error } from '@sveltejs/kit';
import type { DocumentRecord } from '$lib/model';
import { repository, type StoredDocument } from './repository';
export const maxDocumentBytes = 10 * 1024 * 1024;
export async function ownedDocument(id: string, userId: string) {
  const document = await repository.document(id, userId);
  if (!document) error(404, 'Document not found.');
  return document;
}
export async function publicDocument(row: StoredDocument): Promise<DocumentRecord> {
  return { id: row.id, name: row.name, mimeType: row.mime_type, size: row.size, createdAt: row.created_at, applicationIds: await repository.documentApplications(row.id) };
}
export function validateFile(file: File, bytes: Uint8Array) {
  if (!file.size || file.size > maxDocumentBytes) error(400, 'Choose a file up to 10 MB.');
  const name = file.name.replace(/[\x00-\x1f\x7f/\\]/g, '_').trim().slice(0, 180);
  const extension = name.split('.').pop()?.toLowerCase();
  const buffer = Buffer.from(bytes);
  const types: Record<string, string> = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', txt: 'text/plain', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
  if (!extension || !types[extension]) error(400, 'Choose a PDF, DOCX, TXT, PNG, or JPEG file.');
  let valid = false;
  if (extension === 'pdf') valid = buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'));
  if (extension === 'docx') valid = buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) && buffer.includes(Buffer.from('[Content_Types].xml')) && buffer.includes(Buffer.from('word/'));
  if (extension === 'png') valid = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === 'jpg' || extension === 'jpeg') valid = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (extension === 'txt') { try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); valid = !buffer.includes(0); } catch { valid = false; } }
  if (!valid) error(400, 'The file contents do not match its type.');
  return { name, mimeType: types[extension] };
}
export async function boundedFormData(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) error(400, 'Choose a file.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > maxDocumentBytes + 512 * 1024) { await reader.cancel(); error(413, 'Choose a file up to 10 MB.'); }
    chunks.push(value);
  }
  try { return await new Request(request.url, { method: 'POST', headers: { 'Content-Type': request.headers.get('content-type') || '' }, body: Buffer.concat(chunks) }).formData(); }
  catch { error(400, 'Invalid upload.'); }
}
