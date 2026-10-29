import React, { useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, Info, MapPin, Save } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { validCoordinate } from '../utils/mapCoordinates.js';
import ProjectLocationPicker from '../components/projects/ProjectLocationPicker.jsx';

const TYPES = ['Construction', 'Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Renovation', 'Fire safety', 'Facilities', 'Other'];
const STATUSES = ['Planning', 'Active', 'Completed', 'Archived'];
const control = (values, key, setValues) => ({
  value: values[key] ?? '',
  onChange: event => setValues(current => ({ ...current, [key]: event.target.value })),
});
function Field({ label, required = false, children, wide = false }) {
  return <div className={`ssc-pform-field${wide ? ' is-wide' : ''}`}><label><span>{label}{required && <span className="ssc-pform-required"> *</span>}</span>{children}</label></div>;
}

/** Compact creation/editing: only the essentials; older optional data is retained on save. */
export default function ProjectFormPage({ project }) {
  const { workspaces, activeWorkspaceId, saveRecord, go } = usePortal();
  const editing = Boolean(project?.id);
  const [values, setValues] = useState(() => ({
    workspaceId: activeWorkspaceId === 'admin' ? '' : activeWorkspaceId,
    status: 'Active', type: 'Construction', ...project,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const cancel = () => editing ? go('sites', project.id, activeWorkspaceId) : go('sites');
  const submit = event => {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (!workspaces.some(workspace => workspace.id === values.workspaceId)) { setError('Choose a client workspace.'); return; }
    if (!values.name?.trim()) { setError('Enter a project name.'); return; }
    if (!values.address?.trim()) { setError('Enter the site address.'); return; }
    if (values.start && values.end && values.end < values.start) { setError('End date cannot be earlier than the start date.'); return; }
    const latFilled = values.latitude !== '' && values.latitude != null;
    const lngFilled = values.longitude !== '' && values.longitude != null;
    if (latFilled !== lngFilled || (latFilled && !validCoordinate(values.latitude, values.longitude))) {
      setError('Select a valid map location, or leave the pin unset.'); return;
    }
    const data = {
      ...values,
      name: values.name.trim(),
      reference: values.reference?.trim() || (editing ? project.reference : `PRJ-${Date.now().toString(36).toUpperCase()}`),
      address: values.address.trim(), location: values.address.trim(),
      latitude: latFilled ? Number(values.latitude) : '',
      longitude: lngFilled ? Number(values.longitude) : '',
      manager: values.manager?.trim() || '',
    };
    setSaving(true);
    try {
      const saved = saveRecord('projects', data);
      go('sites', saved.id, activeWorkspaceId);
    } catch (reason) {
      setError(reason?.message || 'Could not save the project.');
    } finally { setSaving(false); }
  };

  return <form className="workspace-page ssc-pform ssc-pform-compact" onSubmit={submit} noValidate>
    <header className="ssc-pform-header">
      <div className="ssc-pform-header-copy">
        <button className="ssc-pform-back" type="button" onClick={cancel}><ArrowLeft size={15}/> Back to projects</button>
        <span className="ssc-pform-eyebrow"><Building2 size={15}/> PROJECT SETUP</span>
        <h1>{editing ? 'Edit project' : 'Create project'}</h1>
        <p>Just the basics to get your site ready for inspections. You can update these later.</p>
      </div>
      <div className="ssc-pform-header-actions">
        <button type="button" className="ssc-pform-button" onClick={cancel}>Cancel</button>
        <button type="submit" className="ssc-pform-button primary" disabled={saving}><Save size={16}/>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}</button>
      </div>
    </header>
    {error && <div className="ssc-pform-alert" role="alert"><Info size={17}/>{error}</div>}
    <div className="ssc-pform-grid">
      <div className="ssc-pform-main">
        <section className="ssc-pform-card">
          <div className="ssc-pform-compact-title"><span><Building2 size={19}/></span><div><h2>Project details</h2><p>Name, type and responsibility</p></div></div>
          <div className="ssc-pform-fields">
            <Field label="Project name" required wide><input required placeholder="e.g. Harbour Tower" {...control(values, 'name', setValues)}/></Field>
            <Field label="Project reference (optional)"><input placeholder="Generated automatically if blank" {...control(values, 'reference', setValues)}/></Field>
            <Field label="Project type"><select {...control(values, 'type', setValues)}>{TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></Field>
            {activeWorkspaceId === 'admin' && <Field label="Client workspace" required wide><select required disabled={editing} {...control(values, 'workspaceId', setValues)}><option value="">Select workspace</option>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>}
            <Field label="Project status"><select {...control(values, 'status', setValues)}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></Field>
            <Field label="Project manager"><input placeholder="e.g. Site manager" {...control(values, 'manager', setValues)}/></Field>
          </div>
        </section>
        <section className="ssc-pform-card">
          <div className="ssc-pform-compact-title"><span><MapPin size={19}/></span><div><h2>Site & dates</h2><p>Address and an optional project timeline</p></div></div>
          <div className="ssc-pform-fields">
            <Field label="Site address" required wide><input required placeholder="Street, city or full site address" {...control(values, 'address', setValues)}/></Field>
            <Field label="Start date"><input type="date" {...control(values, 'start', setValues)}/></Field>
            <Field label="Expected completion"><input type="date" min={values.start || undefined} {...control(values, 'end', setValues)}/></Field>
          </div>
        </section>
        <p className="ssc-pform-simple-hint"><CalendarDays size={16}/> Once created, you can start scheduling and recording inspections for this project.</p>
      </div>
      <aside className="ssc-pform-side">
        <section className="ssc-pform-card ssc-pform-map-card">
          <div className="ssc-pform-compact-title"><span><MapPin size={19}/></span><div><h2>Choose site on map</h2><p>Search an address or click to drop a pin</p></div></div>
          <ProjectLocationPicker key={project?.id || 'new'} latitude={values.latitude} longitude={values.longitude}
            onChange={({ latitude, longitude }) => setValues(current => ({ ...current, latitude, longitude }))}
            onAddressFound={address => setValues(current => ({ ...current, address }))}/>
          <p className="ssc-pform-map-note"><Info size={15}/> A map pin is optional. Maps and address search need internet access.</p>
        </section>
      </aside>
    </div>
  </form>;
}
