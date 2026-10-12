/** Async boundary: routes do not depend on SQLite or SQL placeholder syntax.
 * A PostgreSQL implementation can replace this module while retaining the API.
 */
import { removeSampleData } from '$lib/model';
import { validWorkspace } from '$lib/validation';
import { db } from './database';
export interface StoredDocument { id: string; user_id: string; object_key: string; name: string; mime_type: string; size: number; created_at: number }
export const repository = {
  async healthy() {
    return db.query<{ ok: number }, []>('SELECT 1 AS ok').get()?.ok === 1;
  },
  async removeSampleWorkspaces() {
    for (const row of db.query<{ user_id: string; data: string }, []>('SELECT user_id, data FROM workspaces').all()) {
      let data: unknown;
      try { data = JSON.parse(row.data); } catch { continue; }
      if (!validWorkspace(data)) continue;
      const cleaned = removeSampleData(data);
      if (cleaned !== data) await repository.saveWorkspace(row.user_id, cleaned);
    }
  },
  async reminderAccounts() {
    return db.query<{ user_id: string; data: string; email: string }, []>('SELECT w.user_id, w.data, u.email FROM workspaces w JOIN user u ON u.id = w.user_id ORDER BY w.user_id').all();
  },
  async claimReminder(userId: string, day: string, payload: string) {
    return db.transaction(() => {
      const existing = db.query<{ status: string; attempted_at: number; payload: string }, [string, string]>('SELECT status, attempted_at, payload FROM reminder_deliveries WHERE user_id = ? AND day = ?').get(userId, day);
      if (existing?.status === 'sent' || existing?.status === 'processing' && Date.now() - existing.attempted_at < 15 * 60_000) return null;
      if (existing && Date.now() - existing.attempted_at > 23 * 60 * 60_000) return null;
      const body = existing?.payload || payload;
      db.query("INSERT INTO reminder_deliveries(user_id, day, status, attempted_at, payload) VALUES (?, ?, 'processing', ?, ?) ON CONFLICT(user_id, day) DO UPDATE SET status = 'processing', attempted_at = excluded.attempted_at").run(userId, day, Date.now(), body);
      return body;
    })();
  },
  async finishReminder(userId: string, day: string, sent: boolean) {
    db.query('UPDATE reminder_deliveries SET status = ? WHERE user_id = ? AND day = ?').run(sent ? 'sent' : 'failed', userId, day);
  },
  async workspace(userId: string) {
    const row = db.query<{ data: string }, [string]>('SELECT data FROM workspaces WHERE user_id = ?').get(userId);
    return row ? JSON.parse(row.data) : null;
  },
  async saveWorkspace(userId: string, data: unknown) {
    db.query('INSERT INTO workspaces(user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').run(userId, JSON.stringify(data), Date.now());
  },
  async document(id: string, userId: string) {
    return db.query<StoredDocument, [string, string]>('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(id, userId);
  },
  async documents(userId: string, applicationId?: string | null) {
    return applicationId
      ? db.query<StoredDocument, [string, string]>('SELECT d.* FROM documents d JOIN document_applications a ON a.document_id = d.id WHERE d.user_id = ? AND a.application_id = ? ORDER BY d.created_at DESC').all(userId, applicationId)
      : db.query<StoredDocument, [string]>('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },
  async documentApplications(id: string) {
    return db.query<{ application_id: string }, [string]>('SELECT application_id FROM document_applications WHERE document_id = ?').all(id).map(row => row.application_id);
  },
  async documentCounts(userId: string) {
    return {
      total: db.query<{ count: number }, [string]>('SELECT COUNT(*) as count FROM documents WHERE user_id = ?').get(userId)!.count,
      recent: db.query<{ count: number }, [string, number]>('SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND created_at > ?').get(userId, Date.now() - 60_000)!.count
    };
  },
  async createDocument(row: StoredDocument, applicationId?: string | null) {
    db.transaction(() => {
      db.query('INSERT INTO documents(id, user_id, object_key, name, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(row.id, row.user_id, row.object_key, row.name, row.mime_type, row.size, row.created_at);
      if (applicationId) db.query('INSERT INTO document_applications(document_id, application_id) VALUES (?, ?)').run(row.id, applicationId);
    })();
  },
  async attachDocument(id: string, applicationId: string) {
    db.query('INSERT INTO document_applications(document_id, application_id) VALUES (?, ?) ON CONFLICT(document_id, application_id) DO NOTHING').run(id, applicationId);
  },
  async detachDocument(id: string, applicationId: string) {
    db.query('DELETE FROM document_applications WHERE document_id = ? AND application_id = ?').run(id, applicationId);
  },
  async deleteDocument(id: string, userId: string) {
    db.query('DELETE FROM documents WHERE id = ? AND user_id = ?').run(id, userId);
  }
};
