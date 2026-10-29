import { isOpen, isOverdue, metrics, today } from './repository.js';
import { operational } from './inspections.js';

/** View-only dashboard calculations. No synthetic history or inferred compliance. */
export function dashboardSummary(inspections, actions, projects) {
  const realInspections = operational(inspections);
  const realActions = operational(actions);
  return {
    ...metrics(realInspections, realActions),
    projects: projects.filter(p => p.status !== 'Archived').length,
    outstanding: realActions.filter(isOpen).sort((a, b) =>
      Number(isOverdue(b)) - Number(isOverdue(a)) ||
      ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[a.priority] ?? 4) - ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[b.priority] ?? 4) ||
      String(a.due || '9999').localeCompare(String(b.due || '9999'))),
    recent: [...realInspections].sort((a, b) => String(b.date || b.updatedAt || '').localeCompare(String(a.date || a.updatedAt || ''))),
  };
}

export function inspectionActivity(inspections, asOf = today(), months = 6) {
  const [year, month] = asOf.slice(0, 7).split('-').map(Number);
  const series = Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(year, month - months + i, 1));
    return { key: d.toISOString().slice(0, 7), month: d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }), inspections: 0, completed: 0 };
  });
  const byMonth = new Map(series.map(item => [item.key, item]));
  for (const audit of operational(inspections)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(audit.date || '') || audit.date > asOf) continue;
    const bucket = byMonth.get(audit.date.slice(0, 7));
    if (!bucket) continue;
    bucket.inspections += 1;
    if (audit.status === 'Completed') bucket.completed += 1;
  }
  return series;
}

/** Inspect only real, dated inspections in a selected inclusive date range.
 * Uses UTC calendar arithmetic so local time zones do not move records into adjacent buckets.
 */
export function validInspectionDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const utcDay = value => new Date(`${value}T00:00:00Z`);
const toDay = date => date.toISOString().slice(0, 10);
const niceDay = date => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Rolling N calendar months, inclusive of the start date and today. */
export function inspectionPeriodForMonths(asOf, months) {
  if (!validInspectionDate(asOf) || !Number.isInteger(months) || months < 1 || months > 48) {
    throw new Error('A valid date and positive month count are required.');
  }
  const date = utcDay(asOf);
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return { start: toDay(first), end: asOf };
}

/** Auto-bucket short ranges by week and long ranges by month/quarter/year. */
export function inspectionActivityForRange(inspections, start, end, asOf = today()) {
  if (![start, end, asOf].every(validInspectionDate) || start > end) return [];
  const durationDays = Math.floor((utcDay(end) - utcDay(start)) / 86400000) + 1;
  const interval = durationDays <= 14 ? 'day' : durationDays <= 140 ? 'week' : durationDays <= 744 ? 'month' : durationDays <= 3650 ? 'quarter' : 'year';
  const buckets = [];
  let cursor = utcDay(start);
  const rangeEnd = utcDay(end);
  while (cursor <= rangeEnd) {
    let next;
    if (interval === 'day') next = new Date(cursor.getTime() + 86400000);
    else if (interval === 'week') next = new Date(cursor.getTime() + 7 * 86400000);
    else if (interval === 'month') next = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    else if (interval === 'quarter') next = new Date(Date.UTC(cursor.getUTCFullYear(), Math.floor(cursor.getUTCMonth() / 3) * 3 + 3, 1));
    else next = new Date(Date.UTC(cursor.getUTCFullYear() + 1, 0, 1));
    const last = new Date(Math.min(next.getTime() - 86400000, rangeEnd.getTime()));
    const label = interval === 'year' ? String(cursor.getUTCFullYear())
      : interval === 'quarter' ? `Q${Math.floor(cursor.getUTCMonth() / 3) + 1} ${cursor.getUTCFullYear()}`
      : interval === 'month' ? cursor.toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' })
      : niceDay(cursor);
    buckets.push({ key: toDay(cursor), end: toDay(last), label, rangeLabel: `${niceDay(cursor)} – ${niceDay(last)} ${last.getUTCFullYear()}`, inspections: 0, completed: 0, other: 0 });
    cursor = next;
  }
  for (const audit of operational(inspections)) {
    if (!validInspectionDate(audit.date) || audit.date < start || audit.date > end || audit.date > asOf) continue;
    const bucket = buckets.find(b => b.key <= audit.date && audit.date <= b.end);
    if (!bucket) continue;
    bucket.inspections++;
    if (audit.status === 'Completed') bucket.completed++;
    else bucket.other++;
  }
  return buckets;
}
