import { redirect } from '@sveltejs/kit';
import { loginReturn } from '$lib/login-return';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ locals, url }) => {
  const next = loginReturn(url.searchParams.get('next'));
  if (locals.user) redirect(303, next);
  return { next };
};
