import domains from '../data/domains.json';
import topics from '../data/topics.json';
import studyPlans from '../data/studyPlans.json';
import { Domain, Topic } from '../types';

export const domainList = domains as Domain[];
export const topicList = topics as Topic[];

export function getTopicsByDomain(domainId: string) {
  return topicList.filter(t => t.domainId === domainId);
}

export function getDomain(domainId: string) {
  return domainList.find(d => d.id === domainId);
}

export function getStudyTemplate(planId: '30'|'60'|'90') {
  return (studyPlans as any).templates.find((t: any) => t.id === planId);
}

export function generatePlanTasks(planId: '30'|'60'|'90', dailyStudyHours: number) {
  const tpl = getStudyTemplate(planId);
  if (!tpl) return [] as any[];
  const tasks: any[] = [];
  for (const block of tpl.blocks) {
    const [start, end] = block.days;
    const blockTopics = topicList.filter(t => block.domainFocus.includes(t.domainId));
    for (let day = start; day <= end; day++) {
      const baseTotal = block.theoryPerDay + block.labPerDay + block.revisionPerDay;
      const scale = baseTotal > 0 ? dailyStudyHours / baseTotal : 1;
      const idx = (day - start) % Math.max(1, blockTopics.length);
      const focus = blockTopics[idx];
      const isAssessment = day % tpl.weeklyAssessmentDay === 0;
      const isMock = tpl.mockExamDays.includes(day);
      tasks.push({
        day,
        title: isMock ? `Mock Exam / Scenario Practice (Day ${day})` : isAssessment ? `Weekly Assessment & Revision (Day ${day})` : `${block.label}: ${focus?.name || 'Study'}`,
        topicIds: focus ? [focus.id] : blockTopics.slice(0, 3).map((t: Topic) => t.id),
        theoryHours: +(block.theoryPerDay * scale).toFixed(2),
        labHours: +(block.labPerDay * scale).toFixed(2),
        revisionHours: +(block.revisionPerDay * scale).toFixed(2),
        notes: isMock ? 'Timed CKA-style mock exam. Review weak areas after completion.' : isAssessment ? 'Review notes, redo failed labs, and assess weak domains.' : 'Focus on hands-on practice and kubectl speed.'
      });
    }
  }
  return tasks;
}

export function calcCompletionDate(startDate: string, totalDays: number) {
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Math.max(0, totalDays - 1));
  return d.toISOString().slice(0, 10);
}
