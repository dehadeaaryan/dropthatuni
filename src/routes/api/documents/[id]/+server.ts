import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { repository } from '$lib/server/repository';
import { requireUser, sameOrigin, requireApplication } from '$lib/server/access';
import { ownedDocument } from '$lib/server/documents';
import { downloadObject, deleteObject } from '$lib/server/storage';

export const GET: RequestHandler = async (event) => {
  const user = requireUser(event), document = await ownedDocument(event.params.id, user.id);
  try {
    const stream = await downloadObject(document.object_key);
    return new Response(stream, { headers: { 'Content-Type': document.mime_type, 'Content-Length': String(document.size),
      'Content-Disposition': `attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(document.name).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16))}`,
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } });
  } catch (cause) { if (isHttpError(cause)) throw cause; error(502, 'Document download failed. Please try again.'); }
};
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event); sameOrigin(event); await ownedDocument(event.params.id, user.id);
  const body = await event.request.json().catch(() => null);
  if (!body || typeof body.applicationId !== 'string') error(400, 'Choose a program.');
  await requireApplication(user.id, body.applicationId);
  await repository.attachDocument(event.params.id, body.applicationId);
  return json({ attached: true });
};
export const DELETE: RequestHandler = async (event) => {
  const user = requireUser(event); sameOrigin(event);
  const document = await ownedDocument(event.params.id, user.id), applicationId = event.url.searchParams.get('applicationId');
  if (applicationId) {
    await requireApplication(user.id, applicationId);
    await repository.detachDocument(document.id, applicationId);
    return json({ removed: true });
  }
  try { await deleteObject(document.object_key); }
  catch (cause) { if (isHttpError(cause)) throw cause; error(502, 'Document could not be deleted. Please try again.'); }
  await repository.deleteDocument(document.id, user.id);
  return json({ removed: true });
};
