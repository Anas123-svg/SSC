import { operational } from './inspections.js';
import { isOpen, isOverdue, metrics, today } from './repository.js';

/** Aggregate real inspection and finding records only. No synthetic monthly values. */
export function analyticsForScope(inspections = [], actions = [], projects = [], { projectId = '', start = '', end = '' } = {}) {
  const within = date => (!start || (date && date >= start)) && (!end || (date && date <= end));
  const allInspections = operational(inspections).filter(i => (!projectId || i.projectId === projectId) && within(i.date) && (!i.date || i.date <= today()));
  const allActions = operational(actions).filter(a => (!projectId || a.projectId === projectId) && within(a.due || a.createdAt?.slice(0, 10) || a.updatedAt?.slice(0, 10)));
  const scored = allInspections.filter(i => i.status === 'Completed' && i.score !== null && i.score !== '' && Number.isFinite(Number(i.score)));
  const group = new Map();
  for (const record of allInspections) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date || '')) continue;
    const key = record.date.slice(0, 7);
    const item = group.get(key) || { month: key, total: 0, completed: 0, scores: [] };
    item.total++;
    if (record.status === 'Completed') { item.completed++; if (record.score !== '' && record.score != null && Number.isFinite(Number(record.score))) item.scores.push(Number(record.score)); }
    group.set(key, item);
  }
  const trend = [...group.values()].sort((a, b) => a.month.localeCompare(b.month)).map(({ scores, ...row }) => ({ ...row, compliance: scores.length ? Math.round(scores.reduce((n, v) => n + v, 0) / scores.length) : null }));
  const statuses = ['Completed', 'In review', 'Scheduled', 'Draft'].map(status => ({ name: status, value: allInspections.filter(i => status === 'Draft' ? !['Completed','In review','Scheduled'].includes(i.status) : i.status === status).length })).filter(r => r.value);
  const severity = ['Critical','High','Medium','Low'].map(name => ({ name, total: allActions.filter(a => a.priority === name).length, open: allActions.filter(a => a.priority === name && isOpen(a)).length }));
  const comparison = projects.filter(p => p.status !== 'Archived' && (!projectId || p.id === projectId)).map(p => {
    const projectInspections = allInspections.filter(a => a.projectId === p.id);
    const projectActions = allActions.filter(a => a.projectId === p.id);
    const summary = metrics(projectInspections, projectActions);
    return { id: p.id, name: p.name, inspections: summary.total, compliance: summary.compliance, open: summary.open, overdue: summary.overdue };
  }).sort((a, b) => b.inspections - a.inspections);
  const m = metrics(allInspections, allActions);
  const avgScore = scored.length ? Math.round(scored.reduce((n, a) => n + Number(a.score), 0) / scored.length) : null;
  return { inspections: allInspections, actions: allActions, trend, statuses, severity, comparison, metrics: { ...m, compliance: avgScore, completion: m.total ? Math.round(100 * m.completed / m.total) : null, overdue: allActions.filter(isOverdue).length } };
}
export function analyticsWindow(months, asOf = today()) {
  const date = new Date(`${asOf}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - months);
  return { start: date.toISOString().slice(0, 10), end: asOf };
}
