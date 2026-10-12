import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { repository } from '$lib/server/repository';
import { requireUser, sameOrigin } from '$lib/server/access';
import { validWorkspace } from '$lib/validation';

export const GET: RequestHandler = async (event) => {
  const user = requireUser(event);
  return json({ user, workspace: await repository.workspace(user.id) });
};
export const PUT: RequestHandler = async (event) => {
  const user = requireUser(event); sameOrigin(event);
  const body = await event.request.text();
  if (body.length > 2_000_000) error(413, 'Workspace is too large.');
  let data: unknown;
  try { data = JSON.parse(body); } catch { error(400, 'Invalid workspace.'); }
  if (!validWorkspace(data)) error(400, 'Invalid workspace fields.');
  await repository.saveWorkspace(user.id, data);
  return json({ saved: true });
};
