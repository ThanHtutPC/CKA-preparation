import { useMemo, useState } from 'react';
import { topicList } from '../utils/planner';
import { useApp } from '../state/AppContext';
import { ensureTopicProgress } from '../utils/storage';

export default function Notes() {
  const { state, setTopicNotes } = useApp();
  const [q, setQ] = useState('');
  const topics = useMemo(() => topicList.filter(t => {
    const p = ensureTopicProgress(state.topicProgress, t.id);
    const text = `${t.name} ${p.notes || ''}`.toLowerCase();
    return text.includes(q.toLowerCase());
  }), [q, state.topicProgress]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Notes</h2>
        <p className="text-slate-500">Topic အလိုက် personal notes များရေးသားထားနိုင်ပြီး ပြန်လည်ရှာဖွေ လေ့လာနိုင်သည်။</p>
      </div>
      <div className="card p-4"><input className="input" placeholder="Search topic or note content..." value={q} onChange={e=>setQ(e.target.value)} /></div>
      <div className="grid gap-4">
        {topics.map(t => {
          const p = ensureTopicProgress(state.topicProgress, t.id);
          return (
            <div key={t.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{t.name}</h3>
                <span className="text-xs text-slate-500">{p.status} • {p.studyHours}h</span>
              </div>
              <textarea className="input min-h-[120px]" placeholder="Write notes, mistakes, commands, weak areas..." value={p.notes || ''} onChange={e=>setTopicNotes(t.id, e.target.value)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
