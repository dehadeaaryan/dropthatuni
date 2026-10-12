import { timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { remindersConfigured, runReminders } from '$lib/server/reminders';
export const POST: RequestHandler = async ({ request }) => {
  const expected = env.REMINDER_CRON_SECRET;
  if (!expected) error(503, 'Reminders are not configured.');
  const supplied = request.headers.get('authorization') || '';
  const expectedHeader = 'Bearer ' + expected;
  if (Buffer.byteLength(supplied) !== Buffer.byteLength(expectedHeader) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expectedHeader))) error(401, 'Unauthorized.');
  if (!remindersConfigured()) error(503, 'Set the reminder email variables.');
  const result = await runReminders();
  return json(result, { status: result.failed ? 502 : 200 });
};
