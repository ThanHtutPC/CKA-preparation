import { domainList, topicList } from '../utils/planner';
import labs from '../data/labs.json';
import { useApp } from '../state/AppContext';

export default function Reports() {
  const { state } = useApp();
  const completed = topicList.filter(t => state.topicProgress[t.id]?.status === 'completed');
  const inProgress = topicList.filter(t => state.topicProgress[t.id]?.status === 'in_progress');
  const notStarted = topicList.filter(t => (state.topicProgress[t.id]?.status || 'not_started') === 'not_started');
  const weak = domainList.map(d => {
    const dt = topicList.filter(t => t.domainId === d.id);
    const done = dt.filter(t => state.topicProgress[t.id]?.status === 'completed').length;
    const pct = dt.length ? Math.round((done / dt.length) * 100) : 0;
    return { domain: d.name, weight: d.weight, completion: pct };
  }).sort((a,b)=>a.completion-b.completion);
  const labDone = new Set(Object.values(state.topicProgress).flatMap(p => p.completedLabIds || [])).size;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Progress Reports</h2>
        <p className="text-slate-500">Study progress, weak areas, and completion metrics ကို စုစည်းကြည့်ရှုနိုင်သည်။</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Card label="Completed Topics" value={String(completed.length)} />
        <Card label="In Progress" value={String(inProgress.length)} />
        <Card label="Not Started" value={String(notStarted.length)} />
        <Card label="Labs Completed" value={`${labDone}/${(labs as any[]).length}`} />
      </div>
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Weak Areas (lowest domain completion first)</h3>
        <div className="overflow-auto">
          <table className="table">
            <thead><tr><th>Domain</th><th>Exam Weight</th><th>Completion</th><th>Priority Hint</th></tr></thead>
            <tbody>
              {weak.map(w => (
                <tr key={w.domain}>
                  <td>{w.domain}</td><td>{w.weight}%</td><td>{w.completion}%</td>
                  <td className="text-sm text-slate-500">{w.completion < 50 ? 'High priority: focus labs and timed practice' : w.completion < 80 ? 'Medium: continue practice and review' : 'Good: maintain with revision/mocks'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Next Actions</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Prioritize domains with high exam weight and low completion (especially Troubleshooting and Cluster Architecture).</li>
          <li>Complete hands-on labs for topics marked In Progress before moving on.</li>
          <li>Review Notes and mock exam mistakes weekly; schedule targeted practice tasks in the planner.</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="card p-4"><div className="text-sm text-slate-500">{label}</div><div className="text-2xl font-bold mt-1">{value}</div></div>;
}
