import { daysUntil, isRejected, stageOf, todayIn, type WorkspaceData } from './model';
export interface UpcomingTask { id: string; applicationId: string | null; university: string; label: string; dueDate: string; kind: 'application' | 'requirement' | 'fee' | 'decision' | 'deposit' | 'funding' }
export function upcomingTasks(data: Pick<WorkspaceData, 'applications' | 'fees'>): UpcomingTask[] {
  const tasks: UpcomingTask[] = [];
  for (const app of data.applications) {
    if (app.archived || isRejected(app.status)) continue;
    const add = (id: string, label: string, dueDate: string, kind: UpcomingTask['kind']) => tasks.push({ id: app.id + ':' + id, applicationId: app.id, university: app.university, label, dueDate, kind });
    const preparing = stageOf(app.status) < 3 || app.status === 'Incomplete';
    if (preparing) {
      if (app.deadline) add('application', 'Submit application', app.deadline, 'application');
      for (const item of app.requirements) if (!item.done) add(item.id, item.label, item.dueDate || app.deadline, 'requirement');
    }
    const offer = app.offer;
    if (offer) {
      if (['Accepted', 'Conditional offer'].includes(app.status) && offer.responseDeadline) add('decision', 'Respond to offer', offer.responseDeadline, 'decision');
      if (['Accepted', 'Conditional offer', 'Offer accepted'].includes(app.status) && offer.deposit > 0 && !offer.depositPaid && offer.depositDeadline) add('deposit', 'Pay deposit', offer.depositDeadline, 'deposit');
      if (['Applying', 'Applied'].includes(offer.fundingStatus) && offer.fundingDeadline) add('funding', 'Funding deadline', offer.fundingDeadline, 'funding');
    }
  }
  for (const fee of data.fees || []) {
    if (fee.paid) continue;
    const app = data.applications.find(a => a.id === fee.applicationId);
    if (app?.archived || app && isRejected(app.status)) continue;
    tasks.push({ id: 'fee:' + fee.id, applicationId: fee.applicationId, university: app?.university || 'General', label: fee.label, dueDate: fee.dueDate, kind: 'fee' });
  }
  return tasks.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || a.university.localeCompare(b.university));
}
export function reminderTasks(data: WorkspaceData, timezone: string, days: number[], now = new Date()) {
  const today = todayIn(timezone, now);
  return upcomingTasks(data).filter(task => task.dueDate && days.includes(daysUntil(task.dueDate, today)));
}
