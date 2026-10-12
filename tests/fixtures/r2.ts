import type { Plugin } from 'vite';
export function mockR2(): Plugin {
  const emails: { id: string; payload: Record<string, unknown>; key: string }[] = [];
  let failNext = false;
  const objects = new Map<string, Buffer>();
  return {
    name: 'test-r2',
    configureServer(server) {
      server.middlewares.use('/__test-email', async (request, response) => {
        response.setHeader('Content-Type', 'application/json');
        if (request.method === 'GET') { response.end(JSON.stringify(emails)); return; }
        if (request.url?.startsWith('/fail-next')) { failNext = true; response.end('{}'); return; }
        if (failNext) { failNext = false; response.statusCode = 500; response.end('{"message":"Temporary failure"}'); return; }
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        const payload = JSON.parse(Buffer.concat(chunks).toString());
        const key = String(request.headers['idempotency-key']);
        let email = emails.find(e => e.key === key);
        if (!email) { email = { id: crypto.randomUUID(), payload, key }; emails.push(email); }
        response.end(JSON.stringify({ id: email.id }));
      });
      server.middlewares.use('/__test-r2', async (request, response) => {
        const key = (request.url || '/').split('?')[0];
        if (request.method === 'PUT') {
          const chunks: Buffer[] = [];
          for await (const chunk of request) chunks.push(Buffer.from(chunk));
          objects.set(key, Buffer.concat(chunks)); response.statusCode = 200; response.end();
        } else if (request.method === 'DELETE') {
          objects.delete(key); response.statusCode = 204; response.end();
        } else if (objects.has(key)) { response.statusCode = 200; response.end(objects.get(key)); }
        else { response.statusCode = 404; response.end(); }
      });
    }
  };
}
