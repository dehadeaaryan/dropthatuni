import { defaultRequirements, type Application, type Field, type Status } from '../../src/lib/model';
export function testData(): { applications: Application[]; fields: Field[] } {
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
      id: 'fixture-' + i, university, program, location, deadline, status, color, monogram, intake: 'Fall 2028', archived: false,
      requirements: defaultRequirements.map((label, j) => ({ id: `fixture-${i}-${j}`, label, done: j < completed })),
      fields: { notes: '', format: i === 3 || i === 5 ? 'Research' : 'Coursework' }
    })),
    fields: [
      { id: 'format', label: 'Study format', type: 'select', options: ['Coursework', 'Research', 'Professional'], visible: false },
      { id: 'notes', label: 'Notes', type: 'textarea', options: [], visible: true }
    ]
  };
}

