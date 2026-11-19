import fs from 'fs';
import path from 'path';

function esc(v) {
  if (v === null || v === undefined) return '';
  const s = Array.isArray(v) || typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function toCsv(rows) {
  if (!rows.length) return '';
  const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}
function read(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

const base = 'src/data';
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/cka_domains.csv', toCsv(read(path.join(base, 'domains.json'))));
fs.writeFileSync('data/cka_topics.csv', toCsv(read(path.join(base, 'topics.json'))));
fs.writeFileSync('data/cka_courses.csv', toCsv(read(path.join(base, 'courses.json'))));
fs.writeFileSync('data/cka_labs.csv', toCsv(read(path.join(base, 'labs.json'))));
fs.writeFileSync('data/learning_resources.csv', toCsv(read(path.join(base, 'learningResources.json'))));

const sp = read(path.join(base, 'studyPlans.json'));
const planRows = [];
for (const t of (sp.templates || [])) {
  for (const b of (t.blocks || [])) {
    for (let day = b.days[0]; day <= b.days[1]; day++) {
      planRows.push({
        plan_id: t.id,
        plan_name: t.name,
        day,
        block: b.label,
        domain_focus: (b.domainFocus || []).join('|'),
        theory_hours: b.theoryPerDay,
        lab_hours: b.labPerDay,
        revision_hours: b.revisionPerDay,
        weekly_assessment_day: t.weeklyAssessmentDay,
        is_mock_day: (t.mockExamDays || []).includes(day)
      });
    }
  }
}
fs.writeFileSync('data/study_plan.csv', toCsv(planRows));
console.log('CSV datasets written to data/');
