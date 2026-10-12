import { error, type RequestEvent } from '@sveltejs/kit';
import { repository } from './repository';

export function requireUser(event: RequestEvent) {
  if (!event.locals.user) error(401, 'Log in to continue.');
  return event.locals.user;
}
export function sameOrigin(event: RequestEvent) {
  if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Request origin is not allowed.');
}
export async function requireApplication(userId: string, applicationId: string) {
  const data = await repository.workspace(userId);
  if (!data || !data.applications.some((a: { id: string }) => a.id === applicationId)) error(404, 'Program not found.');
}
