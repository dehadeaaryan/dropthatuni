import { createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { repository } from './repository';
import { validWorkspace } from '$lib/validation';
import { reminderTasks } from '$lib/tasks';
import { todayIn, daysUntil } from '$lib/model';

export const remindersConfigured = () => !!(env.RESEND_API_KEY && env.REMINDER_FROM_EMAIL && env.REMINDER_CRON_SECRET);
let running = false;
export async function runReminders(now = new Date()) {
  if (running) return { sent: 0, failed: 0, skipped: 0, busy: true };
  running = true;
  let sent = 0, failed = 0, skipped = 0;
  try {
    for (const account of await repository.reminderAccounts()) {
      if (sent + failed >= 50) break;
      let data: unknown;
      try { data = JSON.parse(account.data); } catch { skipped++; continue; }
      if (!validWorkspace(data) || !data.reminders?.enabled) { skipped++; continue; }
      const settings = data.reminders;
      const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: settings.timezone, hour: '2-digit', hourCycle: 'h23' }).format(now));
      if (hour < settings.hour) { skipped++; continue; }
      const tasks = reminderTasks(data, settings.timezone, settings.days, now);
      if (!tasks.length) { skipped++; continue; }
      const day = todayIn(settings.timezone, now);
      const lines = tasks.slice(0, 200).map(t => {
        const days = daysUntil(t.dueDate, day);
        return `${t.university} — ${t.label}: ${t.dueDate} (${days === 0 ? 'today' : 'in ' + days + ' days'})`;
      });
      const link = env.BETTER_AUTH_URL || env.ORIGIN;
      const payload = JSON.stringify({ from: env.REMINDER_FROM_EMAIL, to: [account.email], subject: `DropThatUni · ${tasks.length} upcoming ${tasks.length === 1 ? 'task' : 'tasks'}`, text: lines.join('\n') + (tasks.length > 200 ? '\nMore tasks in your workspace.' : '') + (link ? '\n\nOpen workspace: ' + new URL('/workspace', link).href + '\nManage reminders in Profile.' : '') });
      const claimed = await repository.claimReminder(account.user_id, day, payload);
      if (!claimed) { skipped++; continue; }
      const key = createHash('sha256').update(account.user_id + ':' + day).digest('hex');
      let success = false;
      try {
        const response = await fetch(env.RESEND_API_URL || 'https://api.resend.com/emails', { method: 'POST',
          headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'dropthatuni-' + key },
          body: claimed, signal: AbortSignal.timeout(15_000) });
        const result = await response.json().catch(() => null);
        success = response.ok && typeof result?.id === 'string';
        if (!success) console.error('Reminder delivery rejected:', response.status);
      } catch { console.error('Reminder delivery failed.'); }
      await repository.finishReminder(account.user_id, day, success);
      if (success) sent++; else failed++;
      // Stay below Resend's default request rate when processing several accounts.
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    return { sent, failed, skipped, busy: false };
  } finally { running = false; }
}
