import { useMemo, useState } from 'react';
import labsData from '../data/labs.json';
import topics from '../data/topics.json';
import { Lab, Topic } from '../types';
import { useApp } from '../state/AppContext';
import { ensureTopicProgress } from '../utils/storage';

export default function LabsPage() {
  const { state, toggleLabCompleted } = useApp();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Lab | null>((labsData as Lab[])[0] || null);
  const labs = labsData as Lab[];
  const topicMap = new Map((topics as Topic[]).map(t => [t.id, t]));
  const filtered = useMemo(() => labs.filter(l => {
    const t = topicMap.get(l.topicId);
    const text = `${l.title} ${l.objective} ${t?.name || ''}`.toLowerCase();
    return text.includes(q.toLowerCase());
  }), [q]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Hands-on Labs</h2>
        <p className="text-slate-500">CKA-style လက်တွေ့လေ့ကျင့်ခန်းများကို step-by-step လုပ်ဆောင်ပြီး completion ကို မှတ်သားနိုင်သည်။</p>
      </div>
      <div className="card p-4"><input className="input" placeholder="Search labs..." value={q} onChange={e=>setQ(e.target.value)} /></div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4 overflow-auto max-h-[75vh] space-y-2">
          {filtered.map(l => {
            const t = topicMap.get(l.topicId);
            const p = ensureTopicProgress(state.topicProgress, l.topicId);
            const done = p.completedLabIds.includes(l.id);
            return (
              <div key={l.id} className={`border rounded-lg p-3 cursor-pointer ${selected?.id===l.id?'border-blue-500 bg-blue-50 dark:bg-slate-800':'border-slate-200 dark:border-slate-800'}`} onClick={()=>setSelected(l)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{l.title}</div>
                    <div className="text-xs text-slate-500">{t?.name || l.topicId}</div>
                  </div>
                  <label className="text-sm flex items-center gap-2" onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" checked={done} onChange={()=>toggleLabCompleted(l.topicId, l.id)} /> Done
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card p-4 overflow-auto max-h-[75vh]">
          {selected ? <LabDetail lab={selected} /> : <p>Select a lab.</p>}
        </div>
      </div>
    </div>
  );
}

function LabDetail({ lab }: { lab: Lab }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="text-xl font-semibold">{lab.title}</h3>
        <p className="text-slate-500 mt-1">{lab.objective}</p>
        <p className="mt-1">{lab.objectiveMm}</p>
      </div>
      <Block title="Prerequisites" items={lab.prerequisites} />
      <Section title="Environment Setup" text={lab.environmentSetup} />
      <Block title="Step-by-step Instructions" items={lab.steps} ordered />
      <Block title="Commands" items={lab.commands} pre />
      <div>
        <h4 className="font-semibold mb-1">YAML Manifests</h4>
        {lab.yamlManifests?.length ? lab.yamlManifests.map(m => (
          <details key={m.name} className="mb-2 border border-slate-200 dark:border-slate-800 rounded-lg p-2">
            <summary className="cursor-pointer font-medium">{m.name}</summary>
            <pre className="text-xs whitespace-pre-wrap mt-2 bg-slate-100 dark:bg-slate-800 p-3 rounded">{m.content}</pre>
          </details>
        )) : <p className="text-slate-500">No manifest required / inspect existing cluster resources.</p>}
      </div>
      <Section title="Expected Output" text={lab.expectedOutput} />
      <Block title="Troubleshooting" items={lab.troubleshooting} />
      <Block title="Verification Checklist" items={lab.verificationChecklist} check />
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return <div><h4 className="font-semibold mb-1">{title}</h4><p className="whitespace-pre-wrap">{text}</p></div>;
}
function Block({ title, items, ordered, pre, check }: { title: string; items: string[]; ordered?: boolean; pre?: boolean; check?: boolean }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="font-semibold mb-1">{title}</h4>
      {pre ? <pre className="text-xs whitespace-pre-wrap bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">{items.join('\n')}</pre> : ordered ? (
        <ol className="list-decimal pl-5 space-y-1">{items.map((i,idx)=><li key={idx}>{i}</li>)}</ol>
      ) : (
        <ul className={`${check ? 'list-none pl-0' : 'list-disc pl-5'} space-y-1`}>{items.map((i,idx)=><li key={idx}>{check ? `☐ ${i}` : i}</li>)}</ul>
      )}
    </div>
  );
}
