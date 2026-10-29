import { sites } from '../data/portalData.js';
export const pretty = d => d ? new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const findSite = id => sites.find(s => s.id === id)?.name || 'Unknown site';
export const initials = name => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
export const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
