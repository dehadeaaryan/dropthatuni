import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { mockR2 } from './tests/fixtures/r2.ts';
export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), ...(mode === 'test' ? [mockR2()] : []), sveltekit()],
  ssr: { external: ['bun:sqlite'] }
}));
