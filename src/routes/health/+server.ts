import { json } from '@sveltejs/kit';
import { repository } from '$lib/server/repository';
export async function GET() {
  try {
    if (await repository.healthy()) return json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { /* Return a generic readiness failure without exposing database details. */ }
  return json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
