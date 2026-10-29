import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sites } from '../src/data/portalData.js';
import { ADMIN_WORKSPACE, createWorkspaceRecord, scopeSiteIds, workspaceSeed, workspaceInitials } from '../src/data/workspaces.js';
import { storageKey } from '../src/features/hxc/hxcModel.js';

test('Admin is first, followed by Harmonix and example sites', () => {
  assert.equal(ADMIN_WORKSPACE.name, 'Admin');
  assert.equal(workspaceSeed[0].name, 'Harmonix');
  assert.equal(workspaceSeed[1].name, 'Northfield Group');
  assert.equal(workspaceSeed[2].name, 'Meridian Contractors');
});

test('switching workspaces selects only their client project locations', () => {
  const all = scopeSiteIds(sites, 'admin', workspaceSeed);
  assert.equal(all.size, sites.length);
  const harmonix = scopeSiteIds(sites, 'harmonix', workspaceSeed);
  assert.equal(harmonix.size, 3);
  for (const id of harmonix) assert.equal(sites.find(site => site.id === id).client, 'Harmonix Developments');
  assert.equal(scopeSiteIds(sites, 'missing', workspaceSeed).size, 0);
});

test('new sites can be created with automatic initials, client names and unique keys', () => {
  const created = createWorkspaceRecord('  Crescent   Construction ', '', workspaceSeed);
  assert.equal(created.name, 'Crescent Construction');
  assert.equal(created.client, 'Crescent Construction');
  assert.equal(created.initials, 'CC');
  assert.match(created.id, /^site-/);
  assert.equal(workspaceInitials(' Site   Safety Consultants '), 'SS');
  assert.throws(() => createWorkspaceRecord('harmonix', 'Different', workspaceSeed), /already exists/);
  assert.throws(() => createWorkspaceRecord('Admin', '', workspaceSeed), /already exists/);
  assert.throws(() => createWorkspaceRecord('  ', '', workspaceSeed), /Enter a site name/);
});

test('HXC audits are saved separately for each client workspace without moving legacy Admin records', () => {
  assert.equal(storageKey('admin'), 'harmonix-hxc-audits-v2');
  assert.equal(storageKey('harmonix'), 'harmonix-hxc-audits-v2-harmonix');
  assert.notEqual(storageKey('northfield'), storageKey('harmonix'));
});
