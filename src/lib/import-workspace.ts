import { validWorkspace } from './validation';
import { defaultReminders, type WorkspaceData } from './model';
export function parseWorkspaceFile(text: string): WorkspaceData {
  if (new TextEncoder().encode(text).byteLength > 2_000_000) throw new Error('Choose a JSON workspace up to 2 MB.');
  let data: unknown;
  try { data = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('Choose a valid JSON file. Remove Markdown code fences first.'); }
  if (!validWorkspace(data)) throw new Error('The workspace does not match the required format. Check dates, statuses, fields, links, and IDs against the prompt.');
  return structuredClone(data);
}
export function mergeWorkspaces(current: WorkspaceData, incoming: WorkspaceData): WorkspaceData {
  const merged: WorkspaceData = JSON.parse(JSON.stringify(current));
  incoming = JSON.parse(JSON.stringify(incoming));
  merged.fees ||= [];
  const appIds = new Map<string, string>(), fieldIds = new Map<string, string>();
  for (const field of incoming.fields) {
    const existing = merged.fields.find(f => f.id === field.id || f.label.toLowerCase() === field.label.toLowerCase() && f.type === field.type);
    const id = existing?.id || field.id;
    fieldIds.set(field.id, id);
    const updated = { ...field, id };
    if (existing) Object.assign(existing, updated); else merged.fields.push(updated);
  }
  for (const app of incoming.applications) {
    const existing = merged.applications.find(a => a.id === app.id || a.university.toLowerCase() === app.university.toLowerCase() && a.program.toLowerCase() === app.program.toLowerCase() && a.intake.toLowerCase() === app.intake.toLowerCase());
    const id = existing?.id || app.id;
    appIds.set(app.id, id);
    const fields = Object.fromEntries(Object.entries(app.fields).map(([key, value]) => [fieldIds.get(key) || key, value]));
    const updated = { ...app, id, fields: { ...existing?.fields, ...fields } };
    if (existing) Object.assign(existing, updated); else merged.applications.push(updated);
  }
  for (const fee of incoming.fees || []) {
    const updated = { ...fee, applicationId: fee.applicationId ? appIds.get(fee.applicationId) || fee.applicationId : null };
    const existing = merged.fees.find(f => f.id === fee.id);
    if (existing) Object.assign(existing, updated); else merged.fees.push(updated);
  }
  merged.reminders ||= defaultReminders();
  if (!validWorkspace(merged)) throw new Error('Merged workspace exceeds the supported limits or contains conflicting IDs.');
  return merged;
}
export function createAiPrompt() {
  return `Create a DropThatUni workspace JSON file for my master's application shortlist. Ask me for target countries, intake, programs, budget and universities if I have not supplied them.

Return ONE UTF-8 .json file containing a JSON object, with no Markdown fences or additional text. Research official university pages if you have web access. Never invent deadlines, fees, funding or admissions facts. Use empty strings/zero for unknown data, and explain unknown financial facts in offer.notes or a Notes custom field. If you cannot research, use only information I supply. Only mark last checked after actually checking the source.

Use this schema exactly. All dates use YYYY-MM-DD or "" (never a datetime). All IDs must be unique nonempty strings. URLs must be full https:// or http:// links or "". Rank applications by their order in the array. All amounts are nonnegative numbers in the stated currency; zero can mean unknown and is not a promise of free tuition.

{
  "version": 1,
  "view": "clean",
  "density": "comfortable",
  "checklist": "summary",
  "collapsed": false,
  "reminders": { "enabled": false, "timezone": "America/Los_Angeles", "hour": 8, "days": [7,3,1,0] },
  "fields": [
    { "id": "notes", "label": "Notes", "type": "textarea", "options": [], "visible": true }
  ],
  "applications": [
    {
      "id": "university-program-intake",
      "university": "University name",
      "program": "Master's program",
      "intake": "Fall 2027",
      "location": "City, country",
      "deadline": "",
      "status": "Considering",
      "color": "#586c66",
      "monogram": "UN",
      "archived": false,
      "applicationUrl": "",
      "sourceUrl": "",
      "checkedDate": "",
      "requirements": [
        { "id": "unique-cv-id", "label": "CV / résumé", "done": false, "dueDate": "" }
      ],
      "fields": { "notes": "Unknown facts or research notes." }
    }
  ],
  "fees": [
    { "id": "unique-fee-id", "applicationId": "university-program-intake", "label": "Application fee", "amount": 0, "currency": "USD", "paid": false, "dueDate": "" }
  ]
}

Fee applicationId must match an application ID, or null for a general expense. Do not create a fee if its amount is unknown. Field values are string, number or boolean. Field types: text, textarea, number, date, select, checkbox, url. Select options are string arrays. Limits: 250 applications, 80 custom fields, 100 requirements per application, 1,000 fees, 2 MB file.

Allowed statuses: Considering, Shortlisted, Preparing, Drafting essays, Awaiting references, Awaiting scores, Awaiting documents, Ready to submit, Submitted, Incomplete, Under review, Interview invited, Interview complete, Waitlisted, Accepted, Conditional offer, Rejected, Offer accepted, Offer declined, Withdrawn.
Allowed currencies: USD, EUR, GBP, CAD, CHF, INR, AUD.

When an offer exists, add this optional "offer" object to that application, including EVERY key:
{
  "receivedDate": "", "responseDeadline": "", "tuition": 0, "scholarship": 0,
  "financialAid": 0, "currency": "USD", "deposit": 0, "depositDeadline": "",
  "depositPaid": false, "fundingDeadline": "", "fundingStatus": "Not applied", "notes": ""
}
fundingStatus must be Not applied, Applying, Applied, Awarded or Declined. Scholarship and financialAid should be non-overlapping awards, in the same currency and tuition period. Record conditions, unknown amounts, award type and tuition period in notes. Do not invent offers; omit offer when none exists.

Do not include passwords, API keys, user IDs, document contents or R2 keys. Import creates application records only; documents must be uploaded separately. Leave reminders disabled until I opt in.
`;
}
