import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { repository } from '$lib/server/repository';
import { requireUser, sameOrigin, requireApplication } from '$lib/server/access';
import { documentsConfigured, uploadObject, deleteObject } from '$lib/server/storage';
import { boundedFormData, publicDocument, validateFile } from '$lib/server/documents';

export const GET: RequestHandler = async (event) => {
  const user = requireUser(event), applicationId = event.url.searchParams.get('applicationId');
  if (applicationId) await requireApplication(user.id, applicationId);
  const rows = await repository.documents(user.id, applicationId);
  return json({ documents: await Promise.all(rows.map(publicDocument)), configured: documentsConfigured() });
};
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event); sameOrigin(event);
  if (!documentsConfigured()) error(503, 'Document storage needs an R2 documents bucket.');
  const counts = await repository.documentCounts(user.id);
  if (counts.total >= 1000) error(400, 'Your document library is full.');
  if (counts.recent >= 20) error(429, 'Please wait before uploading more files.');
  const form = await boundedFormData(event.request), file = form.get('file'), applicationId = form.get('applicationId');
  if (!(file instanceof File)) error(400, 'Choose a file.');
  if (applicationId !== null && typeof applicationId !== 'string') error(400, 'Invalid program.');
  if (applicationId) await requireApplication(user.id, applicationId);
  const bytes = new Uint8Array(await file.arrayBuffer()), { name, mimeType } = validateFile(file, bytes);
  const id = crypto.randomUUID(), key = `dropthatuni/documents/${user.id}/${id}`;
  try {
    await uploadObject(key, bytes, mimeType);
    try {
      await repository.createDocument({ id, user_id: user.id, object_key: key, name, mime_type: mimeType, size: bytes.byteLength, created_at: Date.now() }, applicationId);
    } catch (cause) { await deleteObject(key).catch(() => {}); throw cause; }
    const row = (await repository.document(id, user.id))!;
    return json({ document: await publicDocument(row) }, { status: 201 });
  } catch (cause) { console.error('Document upload error:', cause instanceof Error ? cause.message : 'Unknown storage error'); if (isHttpError(cause)) throw cause; error(502, 'Document upload failed. Check the R2 bucket and its permissions.'); }
};
