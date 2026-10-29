import React from 'react';
import DashboardPage from '../pages/DashboardPage.jsx';
import RecordsPage from '../pages/RecordsPage.jsx';
import ReportingPage from '../pages/ReportingPage.jsx';
import AnalyticsPage from '../pages/AnalyticsPage.jsx';
import SitesPage from '../pages/SitesPage.jsx';
import TeamPage from '../pages/TeamPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import WorkspacesPage from '../pages/WorkspacesPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import InspectionsPage from '../pages/InspectionsPage.jsx';
import InspectionSchedule from '../pages/InspectionSchedule.jsx';
import TemplatesPage from '../pages/TemplatesPage.jsx';
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx';
import AdminUsersPage from '../pages/AdminUsersPage.jsx';
import AdminSettingsPage from '../pages/AdminSettingsPage.jsx';
import { usePortal } from './PortalContext.jsx';
const PAGE_COMPONENTS = { overview: DashboardPage, sites: SitesPage, audits: InspectionsPage, actions: RecordsPage, schedule: InspectionSchedule, documents: RecordsPage, team: TeamPage, users: RecordsPage, clients: RecordsPage, templates: TemplatesPage, reports: ReportsPage, analytics: AnalyticsPage, compliance: ReportingPage, workspaces: WorkspacesPage, settings: SettingsPage, notifications: NotificationsPage };
export default function PageContent({page}) { const {go,activeWorkspaceId}=usePortal();const Component=activeWorkspaceId==='admin' ? ({overview:AdminDashboardPage,users:AdminUsersPage,settings:AdminSettingsPage}[page] || PAGE_COMPONENTS[page]) : PAGE_COMPONENTS[page];return Component?<Component/>:<section className="panel padded"><h2>Page not found</h2><p>Check the URL or return to this workspace's dashboard.</p><button className="btn primary" onClick={()=>go('overview')}>Return to dashboard</button></section>; }

