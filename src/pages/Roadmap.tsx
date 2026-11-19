import domains from '../data/domains.json';
import { getTopicsByDomain } from '../utils/planner';
import { Domain } from '../types';

export default function Roadmap() {
  const ordered = [...(domains as Domain[])].sort((a,b)=>b.weight-a.weight);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Learning Roadmap</h2>
        <p className="text-slate-500">Beginner မှ exam-ready အထိ တက်လှမ်းရန် domain အလိုက် လမ်းညွှန်ချက် (exam weight အရ ဦးစားပေးမှုပါ ထည့်သွင်းထားသည်)။</p>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Recommended Progression</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li><b>Foundation:</b> Kubernetes architecture, kubectl basics, Pods/Deployments/Services, YAML workflow, docs navigation.</li>
          <li><b>Core Administration:</b> kubeadm lifecycle concepts, RBAC, ConfigMaps/Secrets, scheduling, storage basics.</li>
          <li><b>Networking & Storage Depth:</b> Services/Endpoints, DNS/CoreDNS, NetworkPolicy, Ingress/Gateway API, PV/PVC/StorageClass.</li>
          <li><b>Troubleshooting Focus:</b> Cluster/node/component/app/network/storage troubleshooting drills with timed practice.</li>
          <li><b>Exam Readiness:</b> Mixed mock scenarios, weak-area remediation, speed/accuracy optimization.</li>
        </ol>
      </div>
      <div className="grid gap-4">
        {ordered.map((d, idx) => {
          const ts = getTopicsByDomain(d.id);
          return (
            <div key={d.id} className="card p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-semibold">Phase {idx + 1}: {d.name}</h3>
                <span className="badge">Weight {d.weight}%</span>
              </div>
              <p className="text-sm text-slate-500 mb-2">{d.descriptionMm}</p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {ts.map(t => <li key={t.id}><b>{t.name}</b> — {t.examRequired ? 'Exam-required' : 'Supplementary'} ({t.estimatedHours}h, {t.difficulty})</li>)}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="card p-4 text-sm">
        <h3 className="font-semibold mb-2">Exam-required vs Supplementary</h3>
        <p>Curriculum page တွင် ဖော်ပြထားသော competencies များနှင့် တိုက်ရိုက်သက်ဆိုင်သော topics များကို <b>Exam-required</b> အဖြစ် မှတ်ထားပြီး၊ အမှန်တကယ်လုပ်ငန်းခွင်တွင် အသုံးဝင်သော်လည်း core CKA objectives တွင် တိုက်ရိုက်မပါသည့် အကြောင်းအရာများကို <b>Supplementary</b> အဖြစ် ခွဲခြားဖော်ပြထားပါသည်။</p>
      </div>
    </div>
  );
}
