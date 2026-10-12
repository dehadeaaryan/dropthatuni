import { newOffer, defaultRequirements, type Application, type Field, type Status } from './model';
export function sampleData(): { applications: Application[]; fields: Field[] } {
  const samples: [string, string, string, string, Status, string, string, number][] = [
    ['Stanford University', 'MS · Computer Science', 'Stanford, US', '2027-12-01', 'Drafting essays', '#a7393c', 'S', 3],
    ['Carnegie Mellon University', 'MS · Computer Science', 'Pittsburgh, US', '2027-12-10', 'Awaiting references', '#b94f45', 'CM', 4],
    ['ETH Zürich', 'MSc · Computer Science', 'Zürich, CH', '2027-11-30', 'Shortlisted', '#42658a', 'ETH', 1],
    ['University of Oxford', 'MSc · Advanced Computer Science', 'Oxford, UK', '2028-01-07', 'Under review', '#314c75', 'Ox', 7],
    ['Georgia Tech', 'MS · Computer Science', 'Atlanta, US', '2028-02-01', 'Accepted', '#8e7948', 'GT', 7],
    ['University of Toronto', 'MSc · Computer Science', 'Toronto, CA', '2027-12-15', 'Considering', '#586c91', 'T', 0]
  ];
  return {
    applications: samples.map(([university, program, location, deadline, status, color, monogram, completed], i) => ({
      id: 'sample-' + i, university, program, location, deadline, status, color, monogram, intake: 'Fall 2028', archived: false,
      requirements: defaultRequirements.map((label, j) => ({ id: `sample-${i}-${j}`, label, done: j < completed })),
      fields: { notes: '', format: i === 3 || i === 5 ? 'Research' : 'Coursework' }
    })),
    fields: [
      { id: 'format', label: 'Study format', type: 'select', options: ['Coursework', 'Research', 'Professional'], visible: false },
      { id: 'notes', label: 'Notes', type: 'textarea', options: [], visible: true }
    ]
  };
}


export function demoData() {
  const data = sampleData();
  const date = (days: number) => { const now = new Date(); now.setDate(now.getDate() + days); return now.toISOString().slice(0, 10); };
  data.applications.forEach((app, i) => {
    app.deadline = date(12 + i * 7);
    app.intake = 'Fall ' + (new Date().getFullYear() + 1);
    app.requirements.filter(r => !r.done).forEach((r, j) => r.dueDate = date(3 + i * 2 + j));
  });
  data.applications[4].offer = { ...newOffer(), receivedDate: date(-4), responseDeadline: date(21), tuition: 32000, scholarship: 8000, financialAid: 2000, deposit: 500, depositDeadline: date(14), fundingStatus: 'Awarded' };
  return { version: 1 as const, ...data, view: 'clean' as const, density: 'comfortable' as const, checklist: 'summary' as const, collapsed: false,
    fees: [
      { id: 'sample-fee-1', applicationId: data.applications[0].id, label: 'Application fee', amount: 125, currency: 'USD' as const, paid: false, dueDate: date(12) },
      { id: 'sample-fee-2', applicationId: data.applications[1].id, label: 'Application fee', amount: 100, currency: 'USD' as const, paid: true, dueDate: date(19) }
    ] };
}
