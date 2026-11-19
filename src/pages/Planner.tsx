import { useMemo } from 'react';
import { useApp } from '../state/AppContext';
import { calcCompletionDate, generatePlanTasks, getStudyTemplate, topicList } from '../utils/planner';

export default function Planner() {
  const { state, updateSettings } = useApp();
  const { settings } = state;
  const tasks = useMemo(() => generatePlanTasks(settings.activePlanId, settings.dailyStudyHours), [settings.activePlanId, settings.dailyStudyHours]);
  const tpl = getStudyTemplate(settings.activePlanId);
  const completionDate = settings.planStartDate ? calcCompletionDate(settings.planStartDate, tpl?.totalDays || 0) : '';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Daily Study Planner</h2>
        <p className="text-slate-500">30/60/90-day plans ကို မိမိရနိုင်သော daily study time အလိုက် ပြင်ဆင်ပြီး completion date ကို တွက်ချက်နိုင်သည်။</p>
      </div>
      <div className="card p-4 grid md:grid-cols-4 gap-3">
        <label className="text-sm">Plan
          <select className="input mt-1" value={settings.activePlanId} onChange={e=>updateSettings({activePlanId: e.target.value as any})}>
            <option value="30">30-Day Intensive</option>
            <option value="60">60-Day Standard</option>
            <option value="90">90-Day Comfortable</option>
          </select>
        </label>
        <label className="text-sm">Daily study hours
          <input className="input mt-1" type="number" min={0.5} step={0.5} value={settings.dailyStudyHours} onChange={e=>updateSettings({dailyStudyHours: Number(e.target.value)})} />
        </label>
        <label className="text-sm">Plan start date
          <input className="input mt-1" type="date" value={settings.planStartDate || ''} onChange={e=>updateSettings({planStartDate: e.target.value})} />
        </label>
        <div className="text-sm">
          <div className="text-slate-500">Estimated completion date</div>
          <div className="text-lg font-semibold mt-2">{completionDate || 'Set start date'}</div>
          <div className="text-xs text-slate-500">{tpl?.totalDays} days • weekly assessment every {tpl?.weeklyAssessmentDay} days</div>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">{tpl?.name}</h3>
        <p className="text-sm text-slate-500 mb-3">{tpl?.description}</p>
        <div className="text-sm mb-3">Mock exam schedule (day): <b>{(tpl?.mockExamDays || []).join(', ') || 'N/A'}</b></div>
        <div className="overflow-auto">
          <table className="table">
            <thead><tr><th>Day</th><th>Task</th><th>Topics</th><th>Theory</th><th>Lab</th><th>Revision</th><th>Notes</th></tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.day}>
                  <td>{t.day}</td>
                  <td className="font-medium">{t.title}</td>
                  <td className="text-xs">{t.topicIds.map((id: string) => topicList.find(x=>x.id===id)?.name || id).slice(0,2).join(', ')}</td>
                  <td>{t.theoryHours}h</td>
                  <td>{t.labHours}h</td>
                  <td>{t.revisionHours}h</td>
                  <td className="text-xs text-slate-500">{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
