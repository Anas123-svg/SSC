import React from 'react';
import {createRoot} from 'react-dom/client';
import {PortalProvider} from '../../src/app/PortalContext.jsx';
import HxcTemplatePage from '../../src/pages/HxcTemplatePage.jsx';
import {migrateDatabase} from '../../src/data/repository.js';
import '../../src/styles/word-template-v13.css';
const db=migrateDatabase({getItem:()=>null});
createRoot(document.getElementById('root')).render(<PortalProvider value={{db,isAdmin:false,activeWorkspaceId:'harmonix',saveRecord:()=>{throw new Error('Administrator role required.')}}}><HxcTemplatePage/></PortalProvider>);
