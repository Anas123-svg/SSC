export const BRAND = '#EE3861';
export const sites = [
  ['Riverside Quarter', 'Manchester', 96, 8, 'Harmonix Developments'],
  ['Westgate Offices', 'Birmingham', 89, 6, 'Northfield Group'],
  ['Station Road Works', 'Leeds', 92, 5, 'Stonebridge Construction'],
  ['The Foundry', 'London', 98, 7, 'Harmonix Developments'],
  ['Harbour Exchange', 'Liverpool', 84, 4, 'Meridian Contractors'],
  ['Crown House', 'Bristol', 94, 6, 'Northfield Group'],
  ['Meadowbrook Estate', 'Nottingham', 91, 5, 'Beacon Projects'],
  ['Orchard Industrial', 'Sheffield', 97, 7, 'Meridian Contractors'],
  ['Parkside Residences', 'London', 93, 5, 'Beacon Projects'],
  ['Central Logistics Hub', 'Coventry', 90, 6, 'Stonebridge Construction'],
  ['Ashford Works', 'Reading', 95, 4, 'Harmonix Developments'],
  ['Kingsbridge Campus', 'Oxford', 92, 6, 'Northfield Group'],
].map(([name, location, compliance, audits, client], i) => ({ id: `S-${i + 1}`, workspaceId: ['harmonix','northfield','stonebridge','harmonix','meridian','northfield','beacon','meridian','beacon','stonebridge','harmonix','northfield'][i], name, location, compliance, audits, client, status: 'Active' }));
export const teamSeed = [
  { id: 1, name: 'Tony Turner', role: 'Director / Administrator', email: 'tony@example.com', color: '#f8c9d7' },
  { id: 2, name: 'Sarah Mitchell', role: 'Senior H&S Inspector', email: 'sarah@example.com', color: '#cfdef8' },
  { id: 3, name: 'James Carter', role: 'Site Inspector', email: 'james@example.com', color: '#f8e1c0' },
  { id: 4, name: 'Oliver Green', role: 'Site Inspector', email: 'oliver@example.com', color: '#cdebd9' },
];
export const templates = [
  { name: 'Weekly site safety audit', category: 'General safety', questions: 42, desc: 'End-to-end workplace safety assessment' },
  { name: 'CDM compliance inspection', category: 'Compliance', questions: 36, desc: 'CDM 2015 duties, controls and governance' },
  { name: 'Scaffold inspection', category: 'Equipment', questions: 28, desc: 'Access, protection, tags and structural checks' },
  { name: 'Fire safety walkthrough', category: 'Fire safety', questions: 30, desc: 'Fire risks, escape routes and control measures' },
  { name: 'General site inspection', category: 'General safety', questions: 34, desc: 'Site walkaround and hazard observations' },
];
const records = [
  [1, 0, 0, 'Tony Turner', '2026-10-23', 'Completed', 96, 2],
  [2, 3, 1, 'Sarah Mitchell', '2026-10-22', 'Completed', 98, 1],
  [3, 1, 4, 'James Carter', '2026-10-21', 'In review', 89, 4],
  [4, 2, 0, 'Tony Turner', '2026-10-20', 'Completed', 92, 3],
  [5, 5, 2, 'Oliver Green', '2026-10-19', 'Completed', 94, 2],
  [6, 7, 3, 'Sarah Mitchell', '2026-10-18', 'Completed', 97, 1],
  [7, 4, 4, 'James Carter', '2026-10-17', 'In review', 84, 5],
  [8, 6, 0, 'Tony Turner', '2026-10-16', 'Completed', 91, 2],
  [9, 8, 1, 'Oliver Green', '2026-10-15', 'Completed', 93, 3],
  [10, 9, 0, 'James Carter', '2026-10-14', 'Completed', 90, 2],
  [11, 10, 3, 'Sarah Mitchell', '2026-10-13', 'Completed', 95, 1],
  [12, 11, 4, 'Tony Turner', '2026-10-11', 'Completed', 92, 2],
  [13, 1, 2, 'James Carter', '2026-10-28', 'Scheduled', null, 0],
  [14, 4, 0, 'Oliver Green', '2026-10-30', 'Scheduled', null, 0],
];
export const auditsSeed = records.map(([n, site, template, inspector, date, status, score, findings]) => ({ id: `HX-${1049 - n}`, siteId: sites[site].id, type: templates[template].name, inspector, date, status, score, findings }));
export const actionsSeed = [
  ['Unprotected edge at loading bay', 4, 'Critical', 'James Carter', '2026-10-25', 'Open', 'Working at height'],
  ['Update fire evacuation signage', 1, 'High', 'Sarah Mitchell', '2026-10-26', 'Open', 'Fire safety'],
  ['Missing weekly scaffold tag', 2, 'High', 'Oliver Green', '2026-10-27', 'Open', 'Scaffolding'],
  ['Temporary electrical cable routing', 0, 'Medium', 'Tony Turner', '2026-10-29', 'Open', 'Electrical'],
  ['Reposition pedestrian barriers', 9, 'Medium', 'James Carter', '2026-10-31', 'Open', 'Site access'],
  ['Refresh first aid station inventory', 6, 'Low', 'Sarah Mitchell', '2026-11-01', 'Open', 'First aid'],
  ['Replace damaged ladder', 5, 'High', 'Oliver Green', '2026-10-19', 'Closed', 'Work equipment'],
  ['Review lifting plan documentation', 3, 'Medium', 'Tony Turner', '2026-10-18', 'Closed', 'Lifting operations'],
  ['Confirm COSHH storage labels', 7, 'Medium', 'Sarah Mitchell', '2026-10-16', 'Closed', 'COSHH'],
].map(([title, site, priority, assigned, due, status, category], i) => ({ id: `ACT-${204 - i}`, title, siteId: sites[site].id, priority, assigned, due, status, category }));
export const history = [{ month: 'May', compliance: 84, audits: 18 }, { month: 'Jun', compliance: 87, audits: 21 }, { month: 'Jul', compliance: 86, audits: 20 }, { month: 'Aug', compliance: 90, audits: 24 }, { month: 'Sep', compliance: 91, audits: 25 }, { month: 'Oct', compliance: 94, audits: 28 }];
export const weekly = [{ month: 'W1', compliance: 89, audits: 5 }, { month: 'W2', compliance: 91, audits: 7 }, { month: 'W3', compliance: 92, audits: 8 }, { month: 'W4', compliance: 94, audits: 8 }];
