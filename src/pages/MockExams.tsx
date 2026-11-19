import { useState } from 'react';
import { useApp } from '../state/AppContext';

export default function MockExams() {
  const { state, addMockScore } = useApp();
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [score, setScore] = useState(70);
  const [notes, setNotes] = useState('');
  const avg = state.mockExamScores.length ? (state.mockExamScores.reduce((s,m)=>s+m.score,0)/state.mockExamScores.length).toFixed(1) : 'N/A';
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Mock Exams</h2>
        <p className="text-slate-500">Mock exam scores များကို မှတ်တမ်းတင်ပြီး readiness နှင့် weak areas ကို ပြန်လည်သုံးသပ်ပါ။</p>
      </div>
      <div className="card p-4 grid md:grid-cols-4 gap-3 items-end">
        <label className="text-sm">Date<input className="input mt-1" type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
        <label className="text-sm">Score (%)<input className="input mt-1" type="number" min={0} max={100} value={score} onChange={e=>setScore(Number(e.target.value))} /></label>
        <label className="text-sm md:col-span-1">Notes<input className="input mt-1" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Weak domains, timing, etc." /></label>
        <button className="btn btn-primary" onClick={()=>{ addMockScore({date, score, notes}); setNotes(''); }}>Add Mock Score</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="text-sm text-slate-500">Attempts</div><div className="text-2xl font-bold">{state.mockExamScores.length}</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">Average Score</div><div className="text-2xl font-bold">{avg}%</div></div>
        <div className="card p-4"><div className="text-sm text-slate-500">Target</div><div className="text-2xl font-bold">≥ 66-70%</div><div className="text-xs text-slate-500">Use official LF/CNCF guidance and your own target buffer.</div></div>
      </div>
      <div className="card p-4 overflow-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Score</th><th>Notes</th></tr></thead>
          <tbody>
            {state.mockExamScores.slice().reverse().map(m => (
              <tr key={m.id}><td>{m.date}</td><td>{m.score}%</td><td>{m.notes || '-'}</td></tr>
            ))}
            {!state.mockExamScores.length && <tr><td colSpan={3} className="text-slate-500">No mock exam scores yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card p-4 text-sm">
        <h3 className="font-semibold mb-2">CKA Mock Practice Tips</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Time-box each task and practice context/namespace switching first.</li>
          <li>Use imperative commands and <code>--dry-run=client -o yaml</code> for speed.</li>
          <li>Prioritize high-weight domains: Troubleshooting (30%) and Cluster Architecture, Installation & Configuration (25%).</li>
          <li>After each mock, log weak topics in Notes and assign focused labs.</li>
        </ul>
      </div>
    </div>
  );
}
