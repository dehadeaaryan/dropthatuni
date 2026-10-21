import { emptyData, removeSampleData, defaultReminders, initials, newRequirements, type Application, type ApplicationDraft, type Field, type Fee, type WorkspaceData } from './model';
import { demoData } from './demo';
import { validWorkspace } from './validation';
const initial = emptyData();
export const workspace = $state({
  applications: initial.applications, fields: initial.fields, fees: [] as Fee[],
  reminders: defaultReminders(),
  user: null as { id: string; name: string; email: string } | null,
  view: 'clean' as 'clean' | 'table', density: 'comfortable' as 'compact' | 'comfortable' | 'spacious',
  checklist: 'summary' as 'summary' | 'inline', collapsed: false, dark: false,
  section: 'applications' as 'applications' | 'deadlines' | 'archive' | 'fees' | 'documents' | 'tasks', query: '', filter: 'All',
  selectedId: null as string | null, modal: null as 'add' | 'fields' | 'profile' | null,
  demo: false, loaded: false, saveState: 'Log in to save', notice: '', draggedId: null as string | null
});
const key = 'dropthatuni-workspace-v1';
function applyData(data: ReturnType<typeof JSON.parse>) {
  const fresh = emptyData();
  if (data && validWorkspace(data)) data = removeSampleData(data);
  workspace.applications = data?.applications ?? fresh.applications;
  workspace.fields = data?.fields ?? fresh.fields;
  workspace.fees = data?.fees ?? [];
  workspace.reminders = data?.reminders ?? defaultReminders();
  workspace.view = data?.view ?? 'clean';
  workspace.density = data?.density ?? 'comfortable';
  workspace.checklist = data?.checklist ?? 'summary';
  workspace.collapsed = data?.collapsed ?? false;
  workspace.selectedId = null;
  workspace.query = ''; workspace.filter = 'All'; workspace.section = 'applications';
}
function guestData() {
  try { const raw = localStorage.getItem(key); const data = raw ? JSON.parse(raw) : null; return validWorkspace(data) ? data : null; }
  catch { return null; }
}
export function loadDemo() {
  workspace.loaded = false; workspace.demo = true; workspace.user = null; workspace.modal = null;
  applyData(demoData()); workspace.notice = ''; workspace.saveState = 'Demo · not saved';
  workspace.dark = document.documentElement.classList.contains('dark'); workspace.loaded = true;
}
export async function loadWorkspace(importCurrent = false) {
  workspace.demo = false;
  const current = importCurrent ? JSON.parse(snapshot()) : null;
  workspace.loaded = false;
  try {
    const response = await fetch('/api/session');
    if (!response.ok) throw new Error();
    const data = await response.json();
    workspace.user = data.user;
    if (data.user) {
      const response = await fetch('/api/workspace');
      if (!response.ok) throw new Error();
      const account = await response.json();
      applyData(validWorkspace(account.workspace) ? account.workspace : current);
    } else {
      applyData(guestData());
      if (/^\/(workspace|import)(\/|$)/.test(window.location.pathname)) {
        window.location.replace('/login?next=' + encodeURIComponent(window.location.pathname + window.location.search));
        return false;
      }
    }
    workspace.notice = '';
    workspace.saveState = data.user ? 'Saved to your account' : 'Log in to save';
  } catch {
    workspace.user = null;
    applyData(null);
    workspace.notice = 'Could not connect to your account. Please try again.';
    workspace.loaded = true;
    return false;
  }
  workspace.dark = document.documentElement.classList.contains('dark');
  workspace.loaded = true;
  return true;
}
export function snapshot() {
  return JSON.stringify({ version: 1, applications: workspace.applications, fields: workspace.fields, fees: workspace.fees, reminders: workspace.reminders,
    view: workspace.view, density: workspace.density, checklist: workspace.checklist, collapsed: workspace.collapsed });
}
let pending: Promise<boolean> = Promise.resolve(true);
export function saveWorkspace(serialized: string): Promise<boolean> {
  if (workspace.demo) return Promise.resolve(true);
  const userId = workspace.user?.id;
  if (!userId) {
    workspace.saveState = 'Log in to save';
    return Promise.resolve(false);
  }
  pending = pending.catch(() => false).then(async () => {
    if (workspace.demo || workspace.user?.id !== userId) return false;
    workspace.saveState = 'Saving…';
    try {
      const response = await fetch('/api/workspace', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: serialized });
      if (response.status === 401) {
        workspace.loaded = false; workspace.user = null; applyData(null);
        if (/^\/(workspace|import)(\/|$)/.test(window.location.pathname)) window.location.replace('/login?next=' + encodeURIComponent(window.location.pathname + window.location.search));
      }
      if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Log in again.' : 'Changes could not be saved. Please try again.');
      workspace.saveState = 'Saved to your account'; return true;
    } catch (cause) { workspace.saveState = 'Changes not saved'; workspace.notice = cause instanceof Error ? cause.message : 'Changes could not be saved.'; return false; }
  });
  return pending;
}
export function toggleTheme() {
  workspace.dark = !workspace.dark;
  document.documentElement.classList.toggle('dark', workspace.dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', workspace.dark ? '#000000' : '#cfd5c5');
  try { localStorage.setItem('dropthatuni-theme', workspace.dark ? 'dark' : 'light'); } catch { /* Theme still works without storage. */ }
}
export function addApplication(draft: ApplicationDraft, standardChecklist = true, fields: Application['fields'] = {}) {
  const app: Application = { ...draft, university: draft.university.trim(), program: draft.program.trim(), intake: draft.intake.trim(), location: draft.location.trim(), id: crypto.randomUUID(),
    color: '#586c66', monogram: initials(draft.university), archived: false,
    requirements: standardChecklist ? newRequirements() : [], fields };
  workspace.applications.push(app); workspace.selectedId = app.id; workspace.modal = null;
  workspace.section = 'applications'; workspace.query = ''; workspace.filter = 'All';
}
export function reorder(id: string, targetId: string) {
  if (id === targetId) return;
  const items = [...workspace.applications];
  const from = items.findIndex(a => a.id === id), to = items.findIndex(a => a.id === targetId);
  if (from < 0 || to < 0) return;
  const [moved] = items.splice(from, 1); items.splice(to, 0, moved); workspace.applications = items;
}
export function moveRank(id: string, direction: number) {
  const visible = workspace.applications.filter(a => !a.archived);
  const index = visible.findIndex(a => a.id === id);
  const target = visible[index + direction]; if (target) reorder(id, target.id);
}
export function deleteArchivedApplication(id: string) {
  if (!workspace.applications.some(app => app.id === id && app.archived)) return;
  workspace.selectedId = null;
  workspace.fees = workspace.fees.filter(fee => fee.applicationId !== id);
  workspace.applications = workspace.applications.filter(app => app.id !== id);
}
export function addField(field: Omit<Field, 'id' | 'visible'>) {
  workspace.fields.push({ ...field, id: crypto.randomUUID(), visible: true });
}
export function exportWorkspace() {
  const url = URL.createObjectURL(new Blob([snapshot()], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'dropthatuni.json'; link.click(); URL.revokeObjectURL(url);
}

export async function restoreWorkspace(data: WorkspaceData) {
  if (!validWorkspace(data)) throw new Error('Invalid workspace file.');
  const previous = JSON.parse(snapshot());
  workspace.loaded = false;
  applyData(JSON.parse(JSON.stringify(data)));
  const saved = await saveWorkspace(snapshot());
  if (!saved) applyData(previous);
  workspace.loaded = true;
  return saved;
}
