import { removeSampleData, type WorkspaceData } from '$lib/model';
import { validWorkspace } from '$lib/validation';
import { db } from './database';
export interface StoredDocument { id: string; user_id: string; object_key: string; name: string; mime_type: string; size: number; created_at: number }
const documentColumns = 'd.id, d.user_id, d.object_key, d.name, d.mime_type, d.size::float8 AS size, d.created_at::float8 AS created_at';
export const repository = {
  async healthy() {
    return (await db.query<{ ok: number }>('SELECT 1 AS ok')).rows[0]?.ok === 1;
  },
  async removeSampleWorkspaces() {
    const { rows } = await db.query<{ user_id: string; data: unknown }>("SELECT user_id, data FROM workspaces WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(data->'applications') = 'array' THEN data->'applications' ELSE '[]'::jsonb END) app WHERE app->>'id' ~ '^demo-[0-9]+$')");
    for (const row of rows) {
      if (!validWorkspace(row.data)) continue;
      const cleaned = removeSampleData(row.data);
      if (cleaned !== row.data) await repository.saveWorkspace(row.user_id, cleaned);
    }
  },
  async reminderAccounts() {
    return (await db.query<{ user_id: string; data: string; email: string }>('SELECT w.user_id, w.data::text AS data, u.email FROM workspaces w JOIN "user" u ON u.id = w.user_id ORDER BY w.user_id')).rows;
  },
  async claimReminder(userId: string, day: string, payload: string) {
    const now = Date.now();
    const { rows } = await db.query<{ payload: string }>(`
      INSERT INTO reminder_deliveries(user_id, day, status, attempted_at, payload)
      VALUES ($1, $2, 'processing', $3, $4)
      ON CONFLICT(user_id, day) DO UPDATE SET status = 'processing', attempted_at = EXCLUDED.attempted_at
      WHERE reminder_deliveries.status <> 'sent'
        AND (reminder_deliveries.status <> 'processing' OR reminder_deliveries.attempted_at <= $5)
        AND reminder_deliveries.attempted_at >= $6
      RETURNING payload`, [userId, day, now, payload, now - 15 * 60_000, now - 23 * 60 * 60_000]);
    return rows[0]?.payload ?? null;
  },
  async finishReminder(userId: string, day: string, sent: boolean) {
    await db.query('UPDATE reminder_deliveries SET status = $1 WHERE user_id = $2 AND day = $3', [sent ? 'sent' : 'failed', userId, day]);
  },
  async workspace(userId: string) {
    return (await db.query<{ data: WorkspaceData }>('SELECT data FROM workspaces WHERE user_id = $1', [userId])).rows[0]?.data ?? null;
  },
  async saveWorkspace(userId: string, data: unknown) {
    await db.query('INSERT INTO workspaces(user_id, data, updated_at) VALUES ($1, $2::jsonb, $3) ON CONFLICT(user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at', [userId, JSON.stringify(data), Date.now()]);
  },
  async document(id: string, userId: string) {
    return (await db.query<StoredDocument>(`SELECT ${documentColumns} FROM documents d WHERE d.id = $1 AND d.user_id = $2`, [id, userId])).rows[0] ?? null;
  },
  async documents(userId: string, applicationId?: string | null) {
    return applicationId
      ? (await db.query<StoredDocument>(`SELECT ${documentColumns} FROM documents d JOIN document_applications a ON a.document_id = d.id WHERE d.user_id = $1 AND a.application_id = $2 ORDER BY d.created_at DESC`, [userId, applicationId])).rows
      : (await db.query<StoredDocument>(`SELECT ${documentColumns} FROM documents d WHERE d.user_id = $1 ORDER BY d.created_at DESC`, [userId])).rows;
  },
  async documentApplications(id: string) {
    return (await db.query<{ application_id: string }>('SELECT application_id FROM document_applications WHERE document_id = $1', [id])).rows.map(row => row.application_id);
  },
  async documentCounts(userId: string) {
    const { rows } = await db.query<{ total: number; recent: number }>('SELECT COUNT(*)::integer AS total, COUNT(*) FILTER (WHERE created_at > $2)::integer AS recent FROM documents WHERE user_id = $1', [userId, Date.now() - 60_000]);
    return rows[0];
  },
  async createDocument(row: StoredDocument, applicationId?: string | null) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO documents(id, user_id, object_key, name, mime_type, size, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)', [row.id, row.user_id, row.object_key, row.name, row.mime_type, row.size, row.created_at]);
      if (applicationId) await client.query('INSERT INTO document_applications(document_id, application_id) VALUES ($1, $2)', [row.id, applicationId]);
      await client.query('COMMIT');
    } catch (cause) { await client.query('ROLLBACK'); throw cause; }
    finally { client.release(); }
  },
  async attachDocument(id: string, applicationId: string) {
    await db.query('INSERT INTO document_applications(document_id, application_id) VALUES ($1, $2) ON CONFLICT(document_id, application_id) DO NOTHING', [id, applicationId]);
  },
  async detachDocument(id: string, applicationId: string) {
    await db.query('DELETE FROM document_applications WHERE document_id = $1 AND application_id = $2', [id, applicationId]);
  },
  async deleteDocument(id: string, userId: string) {
    await db.query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
  }
};
