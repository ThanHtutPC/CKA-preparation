import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import labs from '../data/labs.json';
import { domainList, topicList, generatePlanTasks, getStudyTemplate } from '../utils/planner';
import { useApp } from '../state/AppContext';
import { ensureTopicProgress } from '../utils/storage';

export default function Dashboard() {
  const { state } = useApp();
  const { topicProgress, settings, mockExamScores } = state;
  const completedTopics = topicList.filter(t => (topicProgress[t.id]?.status || 'not_started') === 'completed').length;
  const inProgressTopics = topicList.filter(t => (topicProgress[t.id]?.status || 'not_started') === 'in_progress').length;
  const totalTopics = topicList.length;
  const progressPct = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const totalStudyHours = Object.values(topicProgress).reduce((sum, p) => sum + (p?.studyHours || 0), 0);
  const completedLabs = new Set(Object.values(topicProgress).flatMap(p => p?.completedLabIds || [])).size;
  const totalLabs = (labs as any[]).length;

  const examDate = settings.examDate ? new Date(settings.examDate) : null;
  const today = new Date();
  const countdown = examDate ? Math.ceil((examDate.getTime() - new Date(today.toDateString()).getTime()) / (1000 * 60 * 60 * 24)) : null;

  const domainData = domainList.map(d => {
    const dTopics = topicList.filter(t => t.domainId === d.id);
    const done = dTopics.filter(t => (topicProgress[t.id]?.status || 'not_started') === 'completed').length;
    return { name: d.name.split(' ')[0], weight: d.weight, completed: dTopics.length ? Math.round((done / dTopics.length) * 100) : 0 };
  });

  const recentMocks = mockExamScores.slice(-6).map((m, i) => ({ name: `#${i + 1}`, score: m.score }));

  const tpl = getStudyTemplate(settings.activePlanId);
  const tasks = generatePlanTasks(settings.activePlanId, settings.dailyStudyHours);
  const upcoming = tasks.slice(0, 5);

  // Simple readiness estimate: weighted by domain exam weights and completion, adjusted by mock average
  const weightedCompletion = domainList.reduce((acc, d) => {
    const dTopics = topicList.filter(t => t.domainId === d.id);
    const done = dTopics.filter(t => (topicProgress[t.id]?.status || 'not_started') === 'completed').length;
    const pct = dTopics.length ? done / dTopics.length : 0;
    return acc + pct * d.weight;
  }, 0);
  const mockAvg = mockExamScores.length ? mockExamScores.reduce((s, m) => s + m.score, 0) / mockExamScores.length : 0;
  const readiness = Math.round(Math.min(100, weightedCompletion * 0.7 + mockAvg * 0.3 + (mockExamScores.length ? 0 : weightedCompletion * 0.3)));

  const weeklyData = [1,2,3,4].map(w => ({ week: `W${w}`, hours: Math.round((totalStudyHours / 4) * (0.7 + w * 0.1)), topics: Math.min(totalTopics, Math.round((completedTopics / 4) * w)) }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-slate-500">CKA ပြင်ဆင်မှု အခြေအနေကို တစ်နေရာတည်းတွင် ခြုံငုံကြည့်ရှုနိုင်သည် (Kubernetes terms များကို English အတိုင်း ထားရှိထားသည်)။</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Overall Progress" value={`${progressPct}%`} sub={`${completedTopics}/${totalTopics} topics completed`} />
        <Stat title="Total Study Hours" value={`${totalStudyHours.toFixed(1)}h`} sub={`${inProgressTopics} topics in progress`} />
        <Stat title="Hands-on Labs" value={`${completedLabs}/${totalLabs}`} sub="Completed lab checkpoints" />
        <Stat title="Exam Countdown" value={countdown === null ? 'Set date' : `${countdown} days`} sub={settings.examDate ? `Exam: ${settings.examDate}` : 'Set exam date in Settings'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-semibold mb-2">Weekly Learning Progress (estimate)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" /><YAxis /><Tooltip />
                <Bar dataKey="hours" fill="#2563eb" name="Hours" />
                <Bar dataKey="topics" fill="#16a34a" name="Topics" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold mb-2">Readiness & Mocks</h3>
          <div className="text-3xl font-bold text-blue-600">{readiness}%</div>
          <p className="text-sm text-slate-500 mb-3">Estimated exam readiness (completion + mock scores)</p>
          <div className="text-sm mb-2">Mock exams taken: <b>{mockExamScores.length}</b></div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentMocks.length ? recentMocks : [{name:'-', score:0}] }>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /><YAxis domain={[0,100]} /><Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Domain Completion vs Official Weight</h3>
          <div className="space-y-3">
            {domainData.map(d => (
              <div key={d.name}>
                <div className="flex justify-between text-sm mb-1"><span>{d.name} (weight {d.weight}%)</span><span>{d.completed}%</span></div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded h-2"><div className="bg-blue-600 h-2 rounded" style={{ width: `${d.completed}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Upcoming Study Tasks ({tpl?.name || settings.activePlanId}-day plan)</h3>
          <ul className="space-y-2 text-sm">
            {upcoming.map(t => (
              <li key={t.day} className="border border-slate-200 dark:border-slate-800 rounded-lg p-2">
                <div className="font-medium">Day {t.day}: {t.title}</div>
                <div className="text-slate-500">Theory {t.theoryHours}h • Lab {t.labHours}h • Revision {t.revisionHours}h</div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Link to="/planner" className="btn btn-primary">Open Planner</Link>
            <Link to="/curriculum" className="btn">View Curriculum</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}
