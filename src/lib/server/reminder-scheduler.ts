import { env } from '$env/dynamic/private';
import { remindersConfigured, runReminders } from './reminders';

let active: Promise<unknown> | null = null;

export async function stopReminderScheduler() {
  const runtime = globalThis as typeof globalThis & { __dropthatuniReminderTimer?: ReturnType<typeof setInterval> };
  if (runtime.__dropthatuniReminderTimer) clearInterval(runtime.__dropthatuniReminderTimer);
  runtime.__dropthatuniReminderTimer = undefined;
  await active;
}

/** Optional scheduler for a persistent single-replica Coolify process.
 * External cron can call the same dispatcher instead.
 */
export function startReminderScheduler() {
  const runtime = globalThis as typeof globalThis & { __dropthatuniReminderTimer?: ReturnType<typeof setInterval> };
  if (runtime.__dropthatuniReminderTimer) clearInterval(runtime.__dropthatuniReminderTimer);
  runtime.__dropthatuniReminderTimer = undefined;
  if (env.REMINDER_AUTO_RUN !== 'true' || !remindersConfigured()) return;
  const run = () => {
    if (active) return;
    active = runReminders().catch(() => console.error('Reminder scheduler failed.')).finally(() => { active = null; });
  };
  runtime.__dropthatuniReminderTimer = setInterval(run, 5 * 60_000);
  runtime.__dropthatuniReminderTimer.unref();
  run();
}
