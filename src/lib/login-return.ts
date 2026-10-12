export function loginReturn(value: string | null) {
  if (!value?.startsWith('/')) return '/workspace';
  try {
    const url = new URL(value, 'http://local');
    return url.origin === 'http://local' && ['/workspace', '/import', '/', '/about'].includes(url.pathname) ? url.pathname + url.search : '/workspace';
  } catch { return '/workspace'; }
}
