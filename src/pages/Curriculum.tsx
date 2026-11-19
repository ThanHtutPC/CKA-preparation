import { useMemo, useState } from 'react';
import domains from '../data/domains.json';
import labs from '../data/labs.json';
import { Domain, Lab, Topic } from '../types';
import { topicList } from '../utils/planner';
import { useApp } from '../state/AppContext';
import { ensureTopicProgress } from '../utils/storage';

export default function Curriculum() {
  const { state, setTopicStatus, toggleLabCompleted, setTopicHours, setTopicDeadline } = useApp();
  const [q, setQ] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [selected, setSelected] = useState<Topic | null>(topicList[0] || null);
  const filtered = useMemo(() => topicList.filter(t => {
    const dOk = domainFilter === 'all' || t.domainId === domainFilter;
    const text = `${t.name} ${t.description} ${t.concepts.join(' ')}`.toLowerCase();
    return dOk && text.includes(q.toLowerCase());
  }), [q, domainFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">CKA Curriculum</h2>
        <p className="text-slate-500">Official domains (CNCF/Linux Foundation) အလိုက် topics များကို လေ့လာပြီး progress မှတ်သားနိုင်သည်။</p>
      </div>
      <div className="card p-4 grid md:grid-cols-3 gap-3">
        <input className="input" placeholder="Search topics/concepts..." value={q} onChange={e => setQ(e.target.value)} />
        <select className="input" value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
          <option value="all">All domains</option>
          {(domains as Domain[]).map(d => <option key={d.id} value={d.id}>{d.name} ({d.weight}%)</option>)}
        </select>
        <div className="text-sm text-slate-500 flex items-center">Showing {filtered.length} / {topicList.length} topics</div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4 overflow-auto max-h-[75vh]">
          <table className="table">
            <thead><tr><th>Topic</th><th>Domain</th><th>Diff</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(t => {
                const d = (domains as Domain[]).find(x => x.id === t.domainId);
                const p = ensureTopicProgress(state.topicProgress, t.id);
                return (
                  <tr key={t.id} className={`cursor-pointer ${selected?.id===t.id?'bg-blue-50 dark:bg-slate-800':''}`} onClick={() => setSelected(t)}>
                    <td>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.examRequired ? 'Exam-required' : 'Supplementary'} • {t.estimatedHours}h</div>
                    </td>
                    <td className="text-xs">{d?.name}</td>
                    <td><span className="badge">{t.difficulty}</span></td>
                    <td>
                      <select className="input" value={p.status} onClick={e=>e.stopPropagation()} onChange={e => setTopicStatus(t.id, e.target.value as any)}>
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card p-4 overflow-auto max-h-[75vh]">
          {selected ? <TopicDetail topic={selected} /> : <p>Select a topic.</p>}
        </div>
      </div>
    </div>
  );

  function TopicDetail({ topic }: { topic: Topic }) {
    const p = ensureTopicProgress(state.topicProgress, topic.id);
    const domain = (domains as Domain[]).find(d => d.id === topic.domainId);
    const topicLabs = (labs as Lab[]).filter(l => topic.labIds.includes(l.id) || l.topicId === topic.id);
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">{topic.name}</h3>
          <p className="text-sm text-slate-500">{domain?.name} • {domain?.weight}% • {topic.examRequired ? 'Official exam-required competency area' : 'Supplementary / beyond core exam tasks'}</p>
          {topic.supplementaryNote && <p className="text-xs text-amber-600 mt-1">{topic.supplementaryNote}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="block">Study hours <input className="input mt-1" type="number" min={0} step={0.5} value={p.studyHours} onChange={e=>setTopicHours(topic.id, Number(e.target.value))} /></label>
          <label className="block">Deadline <input className="input mt-1" type="date" value={p.deadline || ''} onChange={e=>setTopicDeadline(topic.id, e.target.value)} /></label>
        </div>
        <Section title="Description / ဖော်ပြချက်" content={<><p>{topic.description}</p><p className="mt-2">{topic.descriptionMm}</p></>} />
        <Section title="Architecture & Theory / အကြောင်းအရာရှင်းလင်းချက်" content={<><p>{topic.theory}</p><p className="mt-2">{topic.theoryMm}</p></>} />
        <ListSection title="Important Kubernetes Concepts" items={topic.concepts} />
        <ListSection title="kubectl Commands" items={topic.commands} pre />
        <Section title="YAML Examples" content={<pre className="text-xs whitespace-pre-wrap bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto">{topic.yamlExample || 'N/A'}</pre>} />
        <ListSection title="Practical Exercises" items={topic.practicalExercises} />
        <ListSection title="Expected Learning Outcomes" items={topic.expectedOutcomes} />
        <div>
          <h4 className="font-semibold mb-2">Hands-on Labs</h4>
          {topicLabs.length ? topicLabs.map(l => (
            <label key={l.id} className="flex items-start gap-2 text-sm mb-2">
              <input type="checkbox" checked={p.completedLabIds.includes(l.id)} onChange={() => toggleLabCompleted(topic.id, l.id)} />
              <span><b>{l.title}</b> — {l.objectiveMm || l.objective}</span>
            </label>
          )) : <p className="text-sm text-slate-500">No dedicated lab entry mapped yet; use practical exercises and local repo materials.</p>}
        </div>
        <div className="text-sm text-slate-500">Estimated study hours: <b>{topic.estimatedHours}</b> • Difficulty: <b>{topic.difficulty}</b></div>
      </div>
    );
  }
}

function Section({ title, content }: { title: string; content: any }) {
  return <div><h4 className="font-semibold mb-1">{title}</h4><div className="text-sm space-y-1">{content}</div></div>;
}
function ListSection({ title, items, pre }: { title: string; items: string[]; pre?: boolean }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="font-semibold mb-1">{title}</h4>
      {pre ? <pre className="text-xs whitespace-pre-wrap bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">{items.join('\n')}</pre> : <ul className="list-disc pl-5 text-sm space-y-1">{items.map((i,idx)=><li key={idx}>{i}</li>)}</ul>}
    </div>
  );
}
