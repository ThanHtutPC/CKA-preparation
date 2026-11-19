import { useMemo, useState } from 'react';
import courses from '../data/courses.json';
import resources from '../data/learningResources.json';
import domains from '../data/domains.json';

export default function ResourcesPage() {
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('all');
  const [type, setType] = useState('all');
  const courseList = courses as any[];
  const resList = resources as any[];

  const filteredCourses = useMemo(() => courseList.filter(c => {
    const dOk = domain === 'all' || c.domainIds.includes(domain) || c.domainIds.length === 0;
    const text = `${c.name} ${c.provider} ${c.notes}`.toLowerCase();
    return dOk && text.includes(q.toLowerCase());
  }).sort((a,b)=>a.recommendedOrder-b.recommendedOrder), [q, domain]);

  const filteredResources = useMemo(() => resList.filter(r => {
    const dOk = domain === 'all' || r.domainIds.includes(domain) || r.domainIds.length === 0;
    const tOk = type === 'all' || r.kind === type;
    const text = `${r.title} ${r.provider} ${r.notes}`.toLowerCase();
    return dOk && tOk && text.includes(q.toLowerCase());
  }), [q, domain, type]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Courses & Resources</h2>
        <p className="text-slate-500">Verified learning resources များကို စုစည်းထားသည်။ URLs များကို မမှန်မကန် မထည့်ဘဲ အတည်ပြုနိုင်သော အရင်းအမြစ်များကိုသာ ဖော်ပြထားသည်။</p>
      </div>
      <div className="card p-4 grid md:grid-cols-4 gap-3">
        <input className="input md:col-span-2" placeholder="Search courses/resources..." value={q} onChange={e=>setQ(e.target.value)} />
        <select className="input" value={domain} onChange={e=>setDomain(e.target.value)}>
          <option value="all">All domains</option>
          {(domains as any[]).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input" value={type} onChange={e=>setType(e.target.value)}>
          <option value="all">All resource types</option>
          <option value="documentation">Documentation</option>
          <option value="course">Course</option>
          <option value="lab">Lab</option>
          <option value="github">GitHub</option>
          <option value="video">Video</option>
          <option value="mock-exam">Mock Exam</option>
          <option value="tool">Tool</option>
        </select>
      </div>

      <div className="card p-4 overflow-auto">
        <h3 className="font-semibold mb-2">Recommended Courses / Core Resources</h3>
        <table className="table">
          <thead><tr><th>Order</th><th>Name</th><th>Provider</th><th>Type</th><th>Duration</th><th>Domains</th><th>Notes</th></tr></thead>
          <tbody>
            {filteredCourses.map(c => (
              <tr key={c.id}>
                <td>{c.recommendedOrder}</td>
                <td><a className="text-blue-600 underline" href={c.url} target="_blank" rel="noreferrer">{c.name}</a></td>
                <td>{c.provider}</td>
                <td>{c.type}</td>
                <td>{c.duration}</td>
                <td className="text-xs">{c.domainIds.length ? c.domainIds.join(', ') : 'General'}</td>
                <td className="text-xs text-slate-500">{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4 overflow-auto">
        <h3 className="font-semibold mb-2">Learning Resources</h3>
        <table className="table">
          <thead><tr><th>Title</th><th>Kind</th><th>Provider</th><th>Free/Paid</th><th>Domains</th><th>Notes</th></tr></thead>
          <tbody>
            {filteredResources.map(r => (
              <tr key={r.id}>
                <td><a className="text-blue-600 underline" href={r.url} target="_blank" rel="noreferrer">{r.title}</a></td>
                <td>{r.kind}</td>
                <td>{r.provider}</td>
                <td>{r.free ? 'Free' : 'Paid'}</td>
                <td className="text-xs">{r.domainIds.length ? r.domainIds.join(', ') : 'General'}</td>
                <td className="text-xs text-slate-500">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4 text-sm">
        <h3 className="font-semibold mb-2">Resource Curation Note</h3>
        <p>ဤ application တွင် official/verified sources (Kubernetes docs, Linux Foundation CKA page, CNCF curriculum repo, Gateway API docs, Killer.sh, Kubernetes The Hard Way) ကို ဦးစားပေး ထည့်သွင်းထားပါသည်။ ထပ်မံထည့်လိုသော courses/resources များကို JSON/CSV import သို့မဟုတ် data files ပြင်ဆင်ခြင်းဖြင့် တိုးချဲ့နိုင်ပါသည်။</p>
      </div>
    </div>
  );
}
