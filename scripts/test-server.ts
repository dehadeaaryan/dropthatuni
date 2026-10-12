import { startTestPostgres } from '../tests/fixtures/postgres';
const connection = new URL(process.env.DATABASE_URL!);
const stopDatabase = await startTestPostgres(Number(connection.port), connection.pathname.slice(1));
const child = Bun.spawn(process.argv.includes('--production')
  ? ['bun', 'build/index.js']
  : ['bun', '--bun', 'vite', 'dev', '--host', '127.0.0.1', '--port', '5293', '--strictPort', '--mode', 'test'],
  { env: process.env, stdout: 'inherit', stderr: 'inherit' });
let stopping = false;
async function stop() {
  if (stopping) return; stopping = true;
  child.kill('SIGTERM'); await child.exited;
  await stopDatabase(); process.exit(0);
}
process.on('SIGTERM', () => void stop());
process.on('SIGINT', () => void stop());
const code = await child.exited;
if (!stopping) { await stopDatabase(); process.exit(code); }
