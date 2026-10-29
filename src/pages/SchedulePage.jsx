import React, { useMemo, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, CalendarCheck2, CalendarDays, CalendarPlus2,
  CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3,
  FilterX, LayoutGrid, List, MapPin, Plus, Search, UserRound, XCircle,
} from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { RecordForm } from '../components/common/WorkspaceUI.jsx';
import { today } from '../data/repository.js';
import { csv } from '../utils/reporting.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthTitle = d => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const dateKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const localDate = value => {
  const [year, month, day] = String(value || '').slice(0, 10).split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};
const prettyDay = value => localDate(value)?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) || 'Select a date';
const shortDay = value => localDate(value)?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) || 'No date';
const formattedTime = value => value ? value.slice(0, 5) : 'Time not set';
const statusClass = status => String(status || 'Scheduled').toLowerCase().replace(/[^a-z]+/g, '-');
const byTime = (a, b) => `${a.date || ''}T${a.time || '00:00'}`.localeCompare(`${b.date || ''}T${b.time || '00:00'}`);

function CalendarAppointment({ item, project, onClick, compact = false }) {
  return <button type="button" onClick={onClick} className={`sx-event sx-event--${statusClass(item.status)} ${compact ? 'is-compact' : ''}`}
    title={`${formattedTime(item.time)} · ${item.type || 'Inspection'} · ${project}`}>
    <span className="sx-event-dot" />
    <span className="sx-event-text">{item.time && <b>{formattedTime(item.time)}</b>} {item.type || 'Inspection'}</span>
  </button>;
}

function ScheduleRow({ item, project, workspaceName, onClick, showWorkspace }) {
  return <button type="button" className="sx-agenda-row" onClick={onClick}>
    <span className="sx-agenda-time"><Clock3 size={14} /> {formattedTime(item.time)}</span>
    <span className="sx-agenda-main"><strong>{item.type || 'Inspection'}</strong><small><MapPin size={13}/>{project}{showWorkspace && workspaceName ? ` · ${workspaceName}` : ''}</small></span>
    <span className="sx-agenda-inspector"><UserRound size={14}/>{item.inspector || 'Unassigned'}</span>
    <span className={`sx-status sx-status--${statusClass(item.status)}`}>{item.status || 'Scheduled'}</span>
    <ArrowRight size={15} className="sx-agenda-arrow" />
  </button>;
}

export default function SchedulePage() {
  const { activeWorkspaceId, db, scoped, scopedSites, workspaces, saveRecord, matches, go } = usePortal();
  const admin = activeWorkspaceId === 'admin';
  const now = today();
  const current = localDate(now) || new Date();
  const [view, setView] = useState('calendar');
  const [month, setMonth] = useState(() => new Date(current.getFullYear(), current.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(now);
  const [search, setSearch] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [project, setProject] = useState('');
  const [inspector, setInspector] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);

  const all = scoped('schedule');
  const projectNames = useMemo(() => new Map(scopedSites.map(p => [p.id, p.name])), [scopedSites]);
  const workspaceNames = useMemo(() => new Map(workspaces.map(w => [w.id, w.name])), [workspaces]);
  const visibleProjects = scopedSites.filter(p => !workspace || p.workspaceId === workspace);
  const inspectors = [...new Set(all.filter(r => !workspace || r.workspaceId === workspace).map(r => r.inspector).filter(Boolean))].sort();
  const filtered = useMemo(() => all.filter(r => {
    const projectName = projectNames.get(r.projectId) || '';
    return (!workspace || r.workspaceId === workspace)
      && (!project || r.projectId === project)
      && (!inspector || r.inspector === inspector)
      && (!status || (r.status || 'Scheduled') === status)
      && `${r.type || ''} ${r.inspector || ''} ${projectName} ${r.notes || ''} ${workspaceNames.get(r.workspaceId) || ''}`.toLowerCase().includes(search.toLowerCase().trim())
      && matches(r.id, r.type, r.inspector, projectName);
  }).sort(byTime), [all, workspace, project, inspector, status, search, projectNames, workspaceNames, matches]);

  const monthKey = dateKey(month).slice(0, 7);
  const thisMonth = filtered.filter(r => r.date?.slice(0, 7) === monthKey);
  const dayEvents = filtered.filter(r => r.date === selectedDay);
  const nextEvents = filtered.filter(r => r.date >= now && r.status !== 'Cancelled' && r.status !== 'Completed').slice(0, 4);
  const pendingCount = filtered.filter(r => r.date >= now && (r.status || 'Scheduled') === 'Scheduled').length;
  const completedCount = thisMonth.filter(r => r.status === 'Completed').length;
  const cancelledCount = thisMonth.filter(r => r.status === 'Cancelled').length;
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));
  const byDate = useMemo(() => {
    const map = new Map();
    filtered.forEach(r => map.set(r.date, [...(map.get(r.date) || []), r]));
    return map;
  }, [filtered]);
  const groups = useMemo(() => {
    const result = new Map();
    filtered.forEach(r => result.set(r.date || 'undated', [...(result.get(r.date || 'undated') || []), r]));
    return [...result.entries()];
  }, [filtered]);

  const jumpMonth = delta => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    const preferred = localDate(selectedDay)?.getDate() || 1;
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    setMonth(next);
    setSelectedDay(dateKey(new Date(next.getFullYear(), next.getMonth(), Math.min(preferred, last))));
  };
  const selectDate = key => {
    setSelectedDay(key);
    const date = localDate(key);
    if (date) setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };
  const startNew = key => setEditing({ workspaceId: admin ? workspace || '' : activeWorkspaceId, projectId: project || '', date: key || selectedDay || now, time: '09:00', status: 'Scheduled', type: '' });
  const clearFilters = () => { setSearch(''); setWorkspace(''); setProject(''); setInspector(''); setStatus(''); };
  const hasFilters = !!(search || workspace || project || inspector || status);
  const formWorkspace = editing?.workspaceId || (admin ? workspace : activeWorkspaceId);
  const activeWorkspaces = workspaces.filter(w => w.status !== 'Inactive');
  const fields = [
    ...(admin ? [{ key: 'workspaceId', label: 'Workspace', type: 'select', required: true, options: activeWorkspaces.map(w => ({ value: w.id, label: w.name })) }] : []),
    { key: 'projectId', label: 'Project', type: 'select', required: true, options: v => scopedSites.filter(p => p.workspaceId === (admin ? v.workspaceId : activeWorkspaceId) && (p.status !== 'Archived' || p.id === v.projectId)).map(p => ({ value: p.id, label: p.name })) },
    { key: 'type', label: 'Inspection type', type: 'select', required: true, options: v => db.templates.filter(t => t.workspaceIds?.includes(admin ? v.workspaceId : activeWorkspaceId)).map(t => ({ value: t.name, label: t.name })) },
    { key: 'inspector', label: 'Inspector', type: 'select', required: true, options: v => scoped('users').filter(u => u.status !== 'Inactive' && u.workspaceIds?.includes(admin ? v.workspaceId : activeWorkspaceId)).map(u => ({ value: u.name, label: u.name })) },
    { key: 'date', label: 'Inspection date', type: 'date', required: true },
    { key: 'time', label: 'Start time', type: 'time', required: true },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['Scheduled', 'Completed', 'Cancelled'] },
    { key: 'notes', label: 'Planning notes', type: 'textarea', wide: true },
  ];
  const save = value => {
    if (!value.workspaceId) throw new Error('Select a workspace.');
    if (!value.projectId) throw new Error('Select a project.');
    if (!value.date || !value.time) throw new Error('Set a date and start time.');
    saveRecord('schedule', value);
    const d = localDate(value.date);
    if (d) { setSelectedDay(value.date); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }
  };
  const exportCsv = () => csv('inspection-schedule.csv', [
    ['Workspace', 'Project', 'Inspection type', 'Inspector', 'Date', 'Time', 'Status', 'Notes'],
    ...filtered.map(r => [workspaceNames.get(r.workspaceId) || '', projectNames.get(r.projectId) || '', r.type, r.inspector, r.date, r.time, r.status, r.notes]),
  ]);

  return <div className="workspace-page sx-page">
    <div className="sx-hero">
      <div><span className="sx-eyebrow"><CalendarCheck2 size={15}/> SITE OPERATIONS</span><h1>Inspection schedule</h1><p>Plan site visits, assign inspectors, and keep every upcoming check on track.</p></div>
      <button type="button" className="sx-primary" onClick={() => startNew(selectedDay)}><Plus size={17}/> Schedule inspection</button>
    </div>

    <div className="sx-summary">
      <div className="sx-summary-card"><span>Inspections this month <CalendarDays size={17}/></span><strong>{thisMonth.length}</strong><small>{monthTitle(month)} · matching filters</small></div>
      <div className="sx-summary-card"><span>Upcoming inspections <Clock3 size={17}/></span><strong>{pendingCount}</strong><small>Scheduled from today onwards</small></div>
      <div className="sx-summary-card"><span>Completed this month <CheckCircle2 size={17}/></span><strong>{completedCount}</strong><small>Marked as completed</small></div>
      <div className="sx-summary-card"><span>Cancelled this month <XCircle size={17}/></span><strong>{cancelledCount}</strong><small>Cancelled appointments</small></div>
    </div>

    <section className="sx-surface sx-board">
      <div className="sx-board-top">
        <div><h2>Inspection planner</h2><p>See what is planned, where, and who is responsible.</p></div>
        <div className="sx-board-actions">
          <div className="sx-view-switch" role="group" aria-label="Schedule view">
            <button type="button" className={view === 'calendar' ? 'active' : ''} aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}><LayoutGrid size={15}/> Calendar</button>
            <button type="button" className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16}/> List</button>
          </div>
          <button type="button" className="sx-secondary sx-export" onClick={exportCsv}><ArrowDownToLine size={15}/> Export CSV</button>
        </div>
      </div>
      <div className="sx-filter-row">
        <label className="sx-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search planned inspections" placeholder="Search inspections, sites or people" /></label>
        {admin && <label className="sx-select-wrap"><span>Workspace</span><select value={workspace} onChange={e => { setWorkspace(e.target.value); setProject(''); setInspector(''); }}><option value="">All workspaces</option>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}
        <label className="sx-select-wrap"><span>Project</span><select value={project} onChange={e => setProject(e.target.value)}><option value="">All projects</option>{visibleProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="sx-select-wrap"><span>Inspector</span><select value={inspector} onChange={e => setInspector(e.target.value)}><option value="">All inspectors</option>{inspectors.map(name => <option key={name}>{name}</option>)}</select></label>
        <label className="sx-select-wrap"><span>Status</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select></label>
        {hasFilters && <button type="button" className="sx-clear" onClick={clearFilters}><FilterX size={15}/> Clear</button>}
      </div>

      {view === 'calendar' ? <>
        <div className="sx-calendar-toolbar">
          <div className="sx-calendar-heading"><h3>{monthTitle(month)}</h3><span>{thisMonth.length} {thisMonth.length === 1 ? 'inspection' : 'inspections'}</span></div>
          <div className="sx-calendar-navigation"><button type="button" className="sx-today" onClick={() => selectDate(now)}>Today</button><button type="button" onClick={() => jumpMonth(-1)} aria-label="Previous month"><ChevronLeft size={19}/></button><button type="button" onClick={() => jumpMonth(1)} aria-label="Next month"><ChevronRight size={19}/></button></div>
        </div>
        <div className="sx-calendar-layout">
          <div className="sx-calendar-scroll"><div className="sx-calendar" role="group" aria-label={`${monthTitle(month)} inspection calendar`}>
            {WEEKDAYS.map(day => <div className="sx-weekday" key={day} aria-hidden="true">{day}</div>)}
            {days.map(d => {
              const key = dateKey(d), events = byDate.get(key) || [];
              const inMonth = d.getMonth() === month.getMonth();
              return <div key={key} className={`sx-day ${!inMonth ? 'is-outside' : ''} ${key === selectedDay ? 'is-selected' : ''} ${key === now ? 'is-today' : ''}`}>
                <button className="sx-day-number" type="button" onClick={() => selectDate(key)} aria-label={`Show inspections for ${prettyDay(key)}`} aria-pressed={key === selectedDay}>{d.getDate()}</button>
                <div className="sx-day-events">{events.slice(0, 3).map(ev => <CalendarAppointment key={ev.id} item={ev} project={projectNames.get(ev.projectId) || 'Unlinked project'} onClick={() => { selectDate(key); setEditing(ev); }}/>)}</div>
                {events.length > 3 && <button type="button" className="sx-more" onClick={() => selectDate(key)}>+{events.length - 3} more</button>}
                {events.length > 0 && <button type="button" className="sx-mobile-count" onClick={() => selectDate(key)} aria-label={`${events.length} inspections on ${prettyDay(key)}`}>{events.length}</button>}
              </div>;
            })}
          </div></div>
          <aside className="sx-day-panel" aria-label="Selected day inspection details">
            <div className="sx-day-panel-head"><div><span>SELECTED DAY</span><h3>{localDate(selectedDay)?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) || selectedDay}</h3><p>{dayEvents.length ? `${dayEvents.length} planned ${dayEvents.length === 1 ? 'inspection' : 'inspections'}` : 'No inspections on this date'}</p></div><button type="button" onClick={() => startNew(selectedDay)} aria-label="Schedule an inspection for the selected day"><Plus size={19}/></button></div>
            <div className="sx-day-panel-events">{dayEvents.length ? dayEvents.map(r => <button key={r.id} type="button" className="sx-day-appointment" onClick={() => setEditing(r)}><div className="sx-day-appointment-time"><span className={`sx-status-dot sx-status-dot--${statusClass(r.status)}`}/>{formattedTime(r.time)}<ArrowRight size={14}/></div><strong>{r.type || 'Inspection'}</strong><small><MapPin size={12}/>{projectNames.get(r.projectId) || 'Unlinked project'}</small><small><UserRound size={12}/>{r.inspector || 'Unassigned'}</small><span className={`sx-status sx-status--${statusClass(r.status)}`}>{r.status || 'Scheduled'}</span></button>) : <div className="sx-no-day"><CalendarPlus2 size={28}/><strong>Nothing scheduled</strong><p>Select another day or add an inspection here.</p><button type="button" onClick={() => startNew(selectedDay)}><Plus size={15}/> Add inspection</button></div>}</div>
            <div className="sx-up-next"><h4>Coming up next</h4>{nextEvents.length ? nextEvents.map(r => <button type="button" key={r.id} onClick={() => { selectDate(r.date); setEditing(r); }}><span>{shortDay(r.date)}</span><strong>{r.type || 'Inspection'}</strong><ArrowRight size={14}/></button>) : <p>No upcoming inspections match your filters.</p>}</div>
          </aside>
        </div>
      </> : <div className="sx-list-view">
        <div className="sx-list-heading"><div><h3>Scheduled inspections</h3><p>All matching appointments, in date order</p></div><span>{filtered.length} records</span></div>
        {groups.length ? groups.map(([day, items]) => <section key={day} className="sx-agenda-group"><div className="sx-agenda-date"><CalendarDays size={16}/><h4>{day === 'undated' ? 'Date not set' : prettyDay(day)}</h4><span>{items.length}</span></div><div>{items.map(r => <ScheduleRow key={r.id} item={r} project={projectNames.get(r.projectId) || 'Unlinked project'} workspaceName={workspaceNames.get(r.workspaceId)} showWorkspace={admin} onClick={() => setEditing(r)} />)}</div></section>) : <div className="sx-empty"><CalendarDays size={29}/><strong>No matching inspections</strong><p>Try changing your filters or schedule your first inspection.</p><button className="sx-primary" type="button" onClick={() => startNew(now)}><Plus size={16}/> Schedule inspection</button></div>}
      </div>}
      <div className="sx-board-footer"><span><span className="sx-legend-dot"/> Scheduled <span className="sx-legend-dot done"/> Completed <span className="sx-legend-dot cancelled"/> Cancelled</span><span>Appointments are saved in this browser. Completing a scheduled visit does not create an inspection report.</span></div>
    </section>
    {editing && <RecordForm key={editing.id || `${editing.workspaceId}:${editing.date}`} title={editing.id ? 'Edit scheduled inspection' : 'Schedule inspection'} initial={editing} fields={fields} save={save} close={() => setEditing(null)}/>}
  </div>;
}
