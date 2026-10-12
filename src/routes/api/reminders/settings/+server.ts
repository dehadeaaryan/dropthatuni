import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/access';
import { remindersConfigured } from '$lib/server/reminders';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = (event) => {
  requireUser(event);
  return json({ configured: remindersConfigured() });
};
