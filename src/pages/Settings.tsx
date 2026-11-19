import { useRef } from 'react';
import domains from '../data/domains.json';
import topics from '../data/topics.json';
import courses from '../data/courses.json';
import labs from '../data/labs.json';
import resources from '../data/learningResources.json';
import studyPlans from '../data/studyPlans.json';
import { useApp } from '../state/AppContext';
import { downloadText, parseCsv, toCsv } from '../utils/csv';
import { generatePlanTasks } from '../utils/planner';
import { AppState } from '../types';

export default function Settings() {
  const { state, updateSettings, replaceState, resetProgress, setTheme } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportAllJson = () => {
    const payload = { exportedAt: new Date().toISOString(), appState: state, seed: { domains, topics, courses, labs, learningResources: resources, studyPlans } };
    downloadText('cka-study-planner-export.json', JSON.stringify(payload, null, 2), 'application/json');
  };

  const exportDatasetCsvs = () => {
    downloadText('cka_domains.csv', toCsv(domains as any[]));
    downloadText('cka_topics.csv', toCsv(topics as any[]));
    downloadText('cka_courses.csv', toCsv(courses as any[]));
    downloadText('cka_labs.csv', toCsv(labs as any[]));
    downloadText('learning_resources.csv', toCsv(resources as any[]));
    const planRows = generatePlanTasks(state.settings.activePlanId, state.settings.dailyStudyHours).map(t => ({ ...t, topicIds: t.topicIds.join('|') }));
    downloadText('study_plan.csv', toCsv(planRows));
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    if (file.name.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(text);
      if (parsed.appState) {
        replaceState(parsed.appState as AppState);
        alert('Imported app state JSON successfully.');
      } else if (parsed.topicProgress || parsed.settings) {
        replaceState(parsed as AppState);
        alert('Imported state JSON successfully.');
      } else {
        alert('JSON imported, but no appState found. Seed JSON is read-only in this build.');
      }
      return;
    }
    if (file.name.toLowerCase().endsWith('.csv')) {
      const rows = parseCsv(text);
      downloadText('parsed-csv-preview.json', JSON.stringify(rows, null, 2), 'application/json');
      alert('CSV parsed. A preview JSON file was downloaded. (Direct CSV-to-seed replacement is not applied automatically to avoid accidental data loss; use JSON state import for progress/settings restore.)');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-slate-500">Theme, exam date, study preferences, and data import/export ကို စီမံနိုင်သည်။</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold">Preferences</h3>
          <label className="text-sm block">Theme
            <select className="input mt-1" value={state.settings.theme} onChange={e=>setTheme(e.target.value as any)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="text-sm block">Exam date
            <input className="input mt-1" type="date" value={state.settings.examDate || ''} onChange={e=>updateSettings({examDate: e.target.value})} />
          </label>
          <label className="text-sm block">Daily available study time (hours)
            <input className="input mt-1" type="number" min={0.5} step={0.5} value={state.settings.dailyStudyHours} onChange={e=>updateSettings({dailyStudyHours: Number(e.target.value)})} />
          </label>
          <label className="text-sm block">Active study plan
            <select className="input mt-1" value={state.settings.activePlanId} onChange={e=>updateSettings({activePlanId: e.target.value as any})}>
              <option value="30">30-Day Intensive</option>
              <option value="60">60-Day Standard</option>
              <option value="90">90-Day Comfortable</option>
            </select>
          </label>
          <label className="text-sm block">Plan start date
            <input className="input mt-1" type="date" value={state.settings.planStartDate || ''} onChange={e=>updateSettings({planStartDate: e.target.value})} />
          </label>
        </div>
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold">Data Management</h3>
          <p className="text-sm text-slate-500">Progress/settings are persisted in LocalStorage. Export JSON for backup/restore. CSV datasets can be exported for domains/topics/courses/labs/study plan/resources.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={exportAllJson}>Export JSON (state + seed)</button>
            <button className="btn" onClick={exportDatasetCsvs}>Export CSV Datasets</button>
            <button className="btn" onClick={()=>fileRef.current?.click()}>Import JSON/CSV</button>
            <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if (f) onImport(f); e.currentTarget.value=''; }} />
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button className="btn border-red-300 text-red-700 dark:text-red-400" onClick={()=>{ if (confirm('Reset topic progress, notes, and mock scores?')) resetProgress(); }}>Reset Progress Data</button>
          </div>
          <div className="text-xs text-slate-500">
            Storage: LocalStorage (key: <code>cka-study-planner-v1</code>). Architecture is modular so data/state layers can be migrated to IndexedDB or a backend (FastAPI + PostgreSQL) later.
          </div>
        </div>
      </div>
      <div className="card p-4 text-sm">
        <h3 className="font-semibold mb-2">Prepared Dataset Files (repo)</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>src/data/domains.json</code>, <code>src/data/topics.json</code>, <code>src/data/courses.json</code>, <code>src/data/labs.json</code>, <code>src/data/learningResources.json</code>, <code>src/data/studyPlans.json</code></li>
          <li>CSV export generates <code>cka_domains.csv</code>, <code>cka_topics.csv</code>, <code>cka_courses.csv</code>, <code>cka_labs.csv</code>, <code>study_plan.csv</code>, <code>learning_resources.csv</code></li>
        </ul>
      </div>
    </div>
  );
}
