import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.jsx';
import { initPWA } from './pwa.js';

import './styles/styles.css';
import './styles/refinement.css';
import './styles/ssc-theme.css';
import './styles/workspace-sidebar.css';
import './styles/workspace-pages.css';
import './styles/inspection-experience.css';
import './styles/dashboard-reports.css';
import './styles/ssc-v2-pages.css';
import './styles/project-form.css';
import './styles/project-detail.css';
import './styles/analytics-detail.css';
import './styles/admin-simple.css';
import './styles/hxc-document-form.css';
import './styles/pwa-mobile.css';
import './styles/pwa-readability.css';

initPWA();

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

