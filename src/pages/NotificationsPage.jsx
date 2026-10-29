import React from 'react';
import { usePortal } from '../app/PortalContext.jsx';
import { isOverdue } from '../data/repository.js';
import { DataTable, Button, CollectionHeader } from '../components/common/WorkspaceUI.jsx';
export default function NotificationsPage(){const {openActions,go,matches}=usePortal();return <section className="panel padded"><CollectionHeader title="Findings requiring attention" description="Derived from outstanding portfolio corrective actions."/><DataTable rows={openActions.filter(a=>matches(a.title,a.assigned))} columns={[{label:'Finding',key:'title'},{label:'Owner',key:'assigned'},{label:'Due',key:'due'},{label:'Priority',render:a=>isOverdue(a)?'Overdue · '+a.priority:a.priority},{label:'Action',render:()=> <Button onClick={()=>go('audits','actions')}>Open action register</Button>}]}/></section>;}

