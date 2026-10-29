import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
import {test} from 'node:test'

const pages=['OverviewPage','InspectionsPage','SitesPage','CorrectiveActionsPage','ReportsPage','AnalyticsPage','TemplatesPage','TeamPage','SettingsPage']
const hxcTabs=['AuditDetailsTab','ChecklistTab','AuditSummaryTab','AuditActionsTab','PhotoAppendixTab','SignoffTab','ReviewTab']

test('every management page has a standalone module',()=>{
  for(const name of pages) assert.ok(existsSync(new URL(`../src/pages/${name}.jsx`,import.meta.url)),name)
})

test('all HXC editor sections are standalone modules',()=>{
  for(const name of hxcTabs) assert.ok(existsSync(new URL(`../src/features/hxc/tabs/${name}.jsx`,import.meta.url)),name)
})

test('active navigation exposes one inspection module and no risk-assessment module',()=>{
  const nav=readFileSync(new URL('../src/app/navigation.js',import.meta.url),'utf8')
  const route=readFileSync(new URL('../src/app/PageContent.jsx',import.meta.url),'utf8')
  const ids=['overview','audits','sites','actions','reports','analytics','templates','team','settings']
  for(const id of ids){
    assert.match(nav,new RegExp(`\\b${id}\\s*:`))
    assert.match(route,new RegExp(`\\b${id}\\s*:`))
  }
  assert.doesNotMatch(nav, /\b(?:risks|hxc)\s*:/);
  assert.doesNotMatch(route, /\b(?:risks|hxc)\s*:/);
})
