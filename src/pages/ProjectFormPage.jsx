import React, { useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, Info, MapPin, Save } from 'lucide-react';
import { usePortal } from '../app/PortalContext.jsx';
import { validCoordinate } from '../utils/mapCoordinates.js';
import ProjectLocationPicker from '../components/projects/ProjectLocationPicker.jsx';
import { secureImageUrl } from '../data/projectCardPhotos.js';

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
  const [photoError, setPhotoError] = useState('');
  const uploadPhoto = file => {
    if (!file) return;
    setPhotoError('');
    if (!file.type.startsWith('image/')) { setPhotoError('Please select a photograph.'); return; }
    if (file.size > 12 * 1024 * 1024) { setPhotoError('Choose an image smaller than 12 MB.'); return; }
    const reader = new FileReader();
    reader.onerror = () => setPhotoError('The selected photo could not be read.');
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => setPhotoError('This image cannot be opened.');
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1050 / Math.max(image.width,image.height));
        canvas.width = Math.max(1,Math.round(image.width * scale)); canvas.height = Math.max(1,Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) { setPhotoError('Image processing is unavailable.'); return; }
        context.drawImage(image,0,0,canvas.width,canvas.height);
        const photo = canvas.toDataURL('image/jpeg',0.68);
        if (photo.length > 600000) { setPhotoError('Please choose a smaller photograph.'); return; }
        setValues(current => ({ ...current, photo }));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const cancel = () => editing ? go('sites', project.id, activeWorkspaceId) : go('sites');
  const submit = event => {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (!workspaces.some(workspace => workspace.id === values.workspaceId)) { setError('Choose a client workspace.'); return; }
    if (!values.name?.trim()) { setError('Enter a project name.'); return; }
    if (values.photoUrl?.trim() && !secureImageUrl(values.photoUrl)) { setError('Enter a valid HTTPS image URL.'); return; }
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
      photoUrl: values.photoUrl?.trim() || '',
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
        <section className="ssc-pform-card ssc-pform-photo-card">
          <div className="ssc-pform-compact-title"><span><Building2 size={19}/></span><div><h2>Site photograph</h2><p>Shown alongside the real map on the project card</p></div></div>
          {values.photo && /^data:image\/(jpeg|png|webp);base64,/i.test(values.photo) && <img className="ssc-pform-photo-preview" src={values.photo} alt="Project site preview"/>}
          <div className="ssc-pform-fields"><Field label="Online site photo URL (optional)" wide><input type="url" placeholder="https://example.com/actual-site-photo.jpg" {...control(values, 'photoUrl', setValues)}/></Field></div>
          <div className="ssc-pform-photo-actions"><label className="ssc-pform-photo-upload">{values.photo ? 'Replace photo' : 'Upload site photo'}<input type="file" accept="image/*" onChange={event=>{uploadPhoto(event.target.files?.[0]);event.target.value='';}}/></label>{values.photo && <button type="button" onClick={()=>setValues(current=>({...current,photo:''}))}>Remove photo</button>}</div>
          {photoError && <p role="alert" className="ssc-pform-photo-error">{photoError}</p>}
          <small>An uploaded photo is stored locally and takes priority. Otherwise, an HTTPS photo URL can show the real site; without either, a credited reference photo is displayed. Maps use an exact saved pin, or an approximate city area for bundled demo projects.</small>
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
