import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, X, WifiOff } from 'lucide-react';
import { ADMIN_WORKSPACE, isVisibleWorkspace } from '../data/workspaces.js';
import { loadDatabase, saveDatabase, addWorkspace, upsertRecord, scopeRecords, isOpen } from '../data/repository.js';
import { isAdministrator } from './moduleRegistry.js';
import { listInspections, listCorrectiveActions } from '../data/inspections.js';
import { resolveRoute } from './routes.js';
import { canAccessPage, getNavigationForWorkspace, routeFor } from './navigation.js';
import { PortalProvider } from './PortalContext.jsx';
import PageContent from './PageContent.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import Footer from '../components/layout/Footer.jsx';
import CreateWorkspaceDialog from '../components/dialogs/CreateWorkspaceDialog.jsx';
import AppErrorBoundary from './AppErrorBoundary.jsx';
export default function App() {
  const [initial] = useState(() => { try { return { db: loadDatabase(localStorage) }; } catch (e) { return { error: e.message }; } });
  const [db, setDb] = useState(initial.db);
  const [hash, setHash] = useState(window.location.hash);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [appearance, setAppearance] = useState(() => { try { const stored = localStorage.getItem('ssc-appearance-mode'); return ['light','dark','system'].includes(stored) ? stored : 'light'; } catch { return 'light'; } });
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches || false);
  const [permissions] = useState({ role: 'Admin' }); // Demo session; never an authentication boundary.
  const [modal, setModal] = useState(null), [navOpen, setNavOpen] = useState(false), [notify, setNotify] = useState(false);
  const [query, setQuery] = useState(''), [toast, setToast] = useState(''), [storageError, setStorageError] = useState('');
  const [hxcRevision, setHxcRevision] = useState(0);
  const searchRef = useRef(null);
  // A fresh visit or standalone PWA launch must open Harmonix, never Admin.
  // Explicit bookmarks (including /admin) still work.
  const savedId = 'harmonix';
  const route = db ? resolveRoute(hash, db.workspaces, savedId, permissions) : { workspaceId: 'admin', page: 'overview' };
  const { workspaceId: activeWorkspaceId, page, detailId, subview } = route;
  const activeWorkspace = db?.workspaces.find(w => w.id === activeWorkspaceId) || ADMIN_WORKSPACE;
  const isAdmin = isAdministrator(permissions);
  const resolvedAppearance = appearance === 'system' ? (prefersDark ? 'dark' : 'light') : appearance;
  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const changed = event => setPrefersDark(event.matches);
    preference.addEventListener?.('change', changed);
    return () => preference.removeEventListener?.('change', changed);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.workspace = activeWorkspaceId;
    document.documentElement.dataset.theme = resolvedAppearance;
    document.documentElement.style.colorScheme = resolvedAppearance;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', resolvedAppearance === 'dark' ? '#0e1620' : activeWorkspaceId === 'harmonix' ? '#23302A' : '#202833');
    try { localStorage.setItem('ssc-appearance-mode', appearance); } catch { /* Settings remain available for this visit. */ }
  }, [activeWorkspaceId, resolvedAppearance, appearance]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    const changed = () => setHxcRevision(v => v + 1);
    window.addEventListener('ssc-hxc-changed', changed);
    window.addEventListener('storage', changed);
    return () => { window.removeEventListener('ssc-hxc-changed', changed); window.removeEventListener('storage', changed); };
  }, []);
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    window.addEventListener('hashchange', sync); window.addEventListener('popstate', sync);
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); };
  }, []);
  useEffect(() => {
    if (route.redirect && window.location.hash !== route.redirect) { window.history.replaceState(null, '', route.redirect); setHash(route.redirect); }
  }, [route.redirect]);
  useEffect(() => {
    setModal(null); setNavOpen(false); setNotify(false); setQuery('');
    try { localStorage.setItem('harmonix-active-workspace', JSON.stringify(activeWorkspaceId)); } catch { setStorageError('Browser preferences could not be saved.'); }
    window.scrollTo(0, 0);
  }, [activeWorkspaceId, page, detailId, subview]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    const listener = e => { if (e.key === 'Escape') { setModal(null); setNavOpen(false); setNotify(false); } if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener);
  }, []);
  // Persist the migration before accepting edits, retaining every original key as a compatibility backup.
  useEffect(() => { if (initial.db) { try { saveDatabase(localStorage, initial.db); } catch { setStorageError('Browser storage is full or unavailable. Changes cannot be saved.'); } } }, [initial]);
  // Parse photo-heavy HXC documents only when the selected workspace, database,
  // or an HXC audit actually changes (not on every search keystroke).
  const unifiedAudits = useMemo(() => db ? listInspections(db, activeWorkspaceId).filter(r => activeWorkspaceId !== 'admin' || !db.workspaces.some(w => w.id === r.workspaceId && !isVisibleWorkspace(w))) : [], [db, activeWorkspaceId, hxcRevision]);
  const unifiedActions = useMemo(() => db ? listCorrectiveActions(db, activeWorkspaceId).filter(r => activeWorkspaceId !== 'admin' || !db.workspaces.some(w => w.id === r.workspaceId && !isVisibleWorkspace(w))) : [], [db, activeWorkspaceId, hxcRevision]);
  if (initial.error) return <main className="content"><h1>Saved data needs attention</h1><p role="alert">{initial.error}</p><p>Your existing storage has not been overwritten.</p></main>;
  const commit = next => { try { saveDatabase(localStorage, next); setDb(next); setStorageError(''); return next; } catch { throw new Error('Browser storage is full or unavailable. Nothing was saved. Remove an unneeded document or reduce the file size.'); } };
  const go = (id, detail, workspaceId = activeWorkspaceId, section = null) => {
    const workspace = workspaceId === 'admin' ? ADMIN_WORKSPACE : db.workspaces.find(w => w.id === workspaceId);
    if (!workspace || !canAccessPage(workspace, id, permissions)) return;
    const url = routeFor(workspaceId, id, detail, section);
    if (window.location.hash !== url) { window.history.pushState(null, '', url); setHash(url); }
    setModal(null); setNotify(false); setNavOpen(false);
  };
  const selectWorkspace = id => go('overview', null, id);
  const createWorkspace = values => {
    if (!isAdmin) return { ok: false, error: 'Administrator role required.' };
    try { const result = addWorkspace(db, values); commit(result.db); setModal(null); const url = routeFor(result.workspace.id, 'overview'); window.history.pushState(null, '', url); setHash(url); setToast('Workspace created. Register its first project to get started.'); return { ok: true }; }
    catch (e) { return { ok: false, error: e.message }; }
  };
  const saveRecord = (collection, record) => {
    if (['workspaces','clients','templates','users'].includes(collection) && !isAdmin) throw new Error('Administrator role required.');
    const next = commit(upsertRecord(db, collection, record, activeWorkspaceId));
    setToast('Saved in this browser.');
    return next[collection].find(item => item.id === record.id) || next[collection].at(-1);
  };
  const scoped = collection => scopeRecords(db[collection], activeWorkspaceId).filter(r => activeWorkspaceId !== 'admin' || (collection === 'workspaces' ? isVisibleWorkspace(r) : !db.workspaces.some(w => !isVisibleWorkspace(w) && (r.workspaceId === w.id || (Array.isArray(r.workspaceIds) && r.workspaceIds.length === 1 && r.workspaceIds[0] === w.id)))));
  const scopedSites = scoped('projects'), audits = unifiedAudits, actions = unifiedActions, openActions = actions.filter(a => !a.demo && isOpen(a));
  const findProject = id => scopedSites.find(p => p.id === id)?.name || 'Unlinked project';
  const context = {
    db, commit, saveRecord, scoped, page, detailId, subview, activeWorkspaceId, activeWorkspace, workspaces: db.workspaces.filter(isVisibleWorkspace),
    permissions, isAdmin, appearance, setAppearance, resolvedAppearance, navigation: getNavigationForWorkspace(activeWorkspace, permissions), can: id => canAccessPage(activeWorkspace, id, permissions),
    go, setActiveWorkspaceId: selectWorkspace, createWorkspace, scopedSites, audits, actions, team: scoped('users'), openActions,
    high: openActions.filter(a => ['High','Critical'].includes(a.priority)).length, findProject,
    modal, setModal, navOpen, setNavOpen, notify, setNotify, query, setQuery, searchRef, toast, setToast,
    matches: (...values) => values.join(' ').toLowerCase().includes(query.trim().toLowerCase()),
  };
  return <PortalProvider value={context}><div className="shell"><Sidebar /><div className="right-shell"><Topbar /><main className="content">
    {storageError && <p role="alert" className="error">{storageError}</p>}
    {offline && <div className="ssc-offline-banner" role="status"><WifiOff size={16}/> Offline mode: inspections and templates can be edited on this device. Live maps and address search need internet. Remember to save.</div>}
    <AppErrorBoundary key={activeWorkspaceId + ':' + page + ':' + (detailId || '') + ':' + (subview || '')} onHome={() => go('overview', null, 'harmonix')}><PageHeader /><PageContent page={page} /></AppErrorBoundary>
    </main><Footer /></div>{modal?.kind === 'new-workspace' && <CreateWorkspaceDialog close={() => setModal(null)} />}
    {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={15} /></button></div>}
    </div></PortalProvider>;
}

