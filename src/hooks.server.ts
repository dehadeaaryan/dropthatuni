import { redirect, type Handle } from '@sveltejs/kit';
import { building, dev } from '$app/environment';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { startReminderScheduler, stopReminderScheduler } from '$lib/server/reminder-scheduler';
import { db } from '$lib/server/database';
import { auth, authReady } from '$lib/server/auth';

if (!building) {
  void authReady.then(startReminderScheduler).catch(() => {});
  if (!dev) process.once('sveltekit:shutdown', async () => {
    await stopReminderScheduler();
    await db.end();
  });
}

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === '/demo' || event.url.pathname === '/demo/') {
    event.locals.user = null;
    return resolve(event);
  }
  await authReady;
  if (event.url.pathname === '/health') return resolve(event);
  if (!building) {
    // Always replace client-supplied values with the adapter's trusted address.
    let clientAddress: string;
    try { clientAddress = event.getClientAddress(); }
    catch (cause) { if (!dev) throw cause; clientAddress = '127.0.0.1'; }
    event.request.headers.set('x-dropthatuni-client-ip', clientAddress);
    const session = await auth.api.getSession({ headers: event.request.headers });
    event.locals.user = session ? { id: session.user.id, name: session.user.name, email: session.user.email } : null;
  }
  const protectedPage = /^\/(workspace|import)(\/|$)/.test(event.url.pathname);
  if (!building && protectedPage && !event.locals.user) redirect(303, '/login?next=' + encodeURIComponent(event.url.pathname + event.url.search));
  const response = await svelteKitHandler({ auth, event, resolve, building });
  if (event.url.pathname.startsWith('/api/') || protectedPage || event.url.pathname.startsWith('/login')) response.headers.set('Cache-Control', 'no-store');
  return response;
};
