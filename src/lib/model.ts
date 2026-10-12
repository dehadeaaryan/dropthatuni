export const stages = ['Shortlist', 'Prepare', 'Ready', 'Submitted', 'Review', 'Decision'] as const;
export const statuses = [
  { label: 'Considering', stage: 0 }, { label: 'Shortlisted', stage: 0 },
  { label: 'Preparing', stage: 1 }, { label: 'Drafting essays', stage: 1 },
  { label: 'Awaiting references', stage: 1 }, { label: 'Awaiting scores', stage: 1 },
  { label: 'Awaiting documents', stage: 1 }, { label: 'Ready to submit', stage: 2 },
  { label: 'Submitted', stage: 3 }, { label: 'Incomplete', stage: 3 },
  { label: 'Under review', stage: 4 }, { label: 'Interview invited', stage: 4 },
  { label: 'Interview complete', stage: 4 }, { label: 'Waitlisted', stage: 4 },
  { label: 'Accepted', stage: 5 }, { label: 'Conditional offer', stage: 5 },
  { label: 'Rejected', stage: 5 }, { label: 'Offer accepted', stage: 5 },
  { label: 'Offer declined', stage: 5 }, { label: 'Withdrawn', stage: 5 }
] as const;
export type Status = typeof statuses[number]['label'];
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'url';
export type FieldValue = string | number | boolean;
export interface Field { id: string; label: string; type: FieldType; options: string[]; visible: boolean }
export interface Requirement { id: string; label: string; done: boolean; dueDate?: string }
export const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'INR', 'AUD'] as const;
export type Currency = typeof currencies[number];
export interface Fee { id: string; applicationId: string | null; label: string; amount: number; currency: Currency; paid: boolean; dueDate: string }
export interface DocumentRecord { id: string; name: string; mimeType: string; size: number; createdAt: number; applicationIds: string[] }
export function formatMoney(amount: number, currency: Currency) { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
export function feeTotals(fees: Fee[], currency: Currency) {
  const matching = fees.filter(f => f.currency === currency);
  const total = matching.reduce((sum, f) => sum + Math.round(f.amount * 100), 0);
  const paid = matching.filter(f => f.paid).reduce((sum, f) => sum + Math.round(f.amount * 100), 0);
  return { total: total / 100, paid: paid / 100, unpaid: (total - paid) / 100 };
}
export interface Offer {
  receivedDate: string; responseDeadline: string; tuition: number; scholarship: number;
  financialAid: number; currency: Currency; deposit: number; depositDeadline: string;
  depositPaid: boolean; fundingDeadline: string; fundingStatus: 'Not applied' | 'Applying' | 'Applied' | 'Awarded' | 'Declined'; notes: string;
}
export const newOffer = (): Offer => ({ receivedDate: '', responseDeadline: '', tuition: 0, scholarship: 0, financialAid: 0, currency: 'USD', deposit: 0, depositDeadline: '', depositPaid: false, fundingDeadline: '', fundingStatus: 'Not applied', notes: '' });
export interface ReminderSettings { enabled: boolean; timezone: string; hour: number; days: number[] }
export const defaultReminders = (): ReminderSettings => ({ enabled: false, timezone: 'America/Los_Angeles', hour: 8, days: [7, 3, 1, 0] });
export interface WorkspaceData { version: 1; applications: Application[]; fields: Field[]; fees?: Fee[]; reminders?: ReminderSettings; view: 'clean' | 'table'; density: 'compact' | 'comfortable' | 'spacious'; checklist: 'summary' | 'inline'; collapsed: boolean }
export interface Application {
  id: string; university: string; program: string; intake: string; location: string;
  deadline: string; status: Status; color: string; monogram: string; archived: boolean;
  applicationUrl?: string; sourceUrl?: string; checkedDate?: string; offer?: Offer;
  requirements: Requirement[]; fields: Record<string, FieldValue>;
}
export const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' }, { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' }, { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' }, { value: 'checkbox', label: 'Checkbox' }, { value: 'url', label: 'Link' }
];
export const presets: Omit<Field, 'id' | 'visible'>[] = [
  { label: 'Application fee', type: 'number', options: [] },
  { label: 'Tuition', type: 'number', options: [] },
  { label: 'Application link', type: 'url', options: [] },
  { label: 'Funding deadline', type: 'date', options: [] },
  { label: 'Duration', type: 'text', options: [] },
  { label: 'Study format', type: 'select', options: ['Coursework', 'Research', 'Professional'] },
  { label: 'GRE', type: 'select', options: ['Required', 'Optional', 'Not accepted', 'Unknown'] },
  { label: 'Scholarship', type: 'checkbox', options: [] }
];
export function stageOf(status: Status) { return statuses.find(s => s.label === status)?.stage ?? 0; }
export function isAccepted(status: Status) { return ['Accepted', 'Conditional offer', 'Offer accepted'].includes(status); }
export function isRejected(status: Status) { return ['Rejected', 'Offer declined', 'Withdrawn'].includes(status); }
export function initials(name: string) { return name.split(/\s+/).filter(Boolean).map(s => s[0]).join('').slice(0, 2).toUpperCase(); }
export function formatDate(value: string) {
  if (!value) return 'No date';
  return new Date(value + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
export function safeLink(value: FieldValue | undefined) {
  try { const url = new URL(String(value)); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export const defaultRequirements = ['CV / résumé', 'Statement of purpose', 'Transcripts', 'Reference 1', 'Reference 2', 'Reference 3', 'Test scores'];
export function newRequirements(completed = 0): Requirement[] { return defaultRequirements.map((label, i) => ({ id: crypto.randomUUID(), label, done: i < completed })); }
export function emptyData(): { applications: Application[]; fields: Field[] } {
  return { applications: [], fields: [
    { id: 'format', label: 'Study format', type: 'select', options: ['Coursework', 'Research', 'Professional'], visible: false },
    { id: 'notes', label: 'Notes', type: 'textarea', options: [], visible: true }
  ] };
}
export function removeSampleData(data: WorkspaceData): WorkspaceData {
  const removed = new Set(data.applications.filter(app => /^demo-\d+$/.test(app.id)).map(app => app.id));
  if (!removed.size) return data;
  return { ...data, applications: data.applications.filter(app => !removed.has(app.id)), fees: (data.fees || []).filter(fee => !fee.applicationId || !removed.has(fee.applicationId)) };
}

export function applicationLink(app: Application, fields: Field[]) {
  return safeLink(app.applicationUrl) || safeLink(app.fields[fields.find(f => f.type === 'url' && /application (link|url)/i.test(f.label))?.id ?? '']);
}
export function validTimezone(value: string) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }).format(); return true; } catch { return false; }
}
export function todayIn(timezone: string, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function daysUntil(date: string, today: string) {
  return Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
}
