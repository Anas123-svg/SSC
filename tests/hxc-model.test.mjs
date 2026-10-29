import assert from 'node:assert/strict'
import {test} from 'node:test'
import {hxcTemplate} from '../src/features/hxc/hxcTemplate.js'
import {createBlank,computed,validate} from '../src/features/hxc/hxcModel.js'
import {findSite,pretty} from '../src/utils/portal.js'
import {sites} from '../src/data/portalData.js'

test('HXC model retains the complete source checklist',()=>{
  assert.equal(hxcTemplate.length,10)
  assert.equal(hxcTemplate.reduce((count,section)=>count+section.items.length,0),65)
  const ids=hxcTemplate.flatMap(section=>section.items.map(item=>item.id))
  assert.equal(new Set(ids).size,65)
})

test('new audits remain incomplete until required evidence is supplied',()=>{
  const draft=createBlank()
  assert.equal(draft.state,'Draft')
  assert.equal(computed(draft).answered,0)
  assert.equal(computed(draft).score,null)
  assert.ok(validate(draft).length>0)
})

test('compliance score is the average of applicable SECTION scores',()=>{
  const draft=createBlank()
  draft.sections={1:{score:8,na:false},2:{score:6,na:false},3:{score:null,na:true}}
  assert.equal(computed(draft).score,70)
  assert.equal(computed(draft).applicable,2)
})

test('shared portfolio formatting uses the existing site data',()=>{
  assert.equal(findSite(sites[0].id),sites[0].name)
  assert.equal(findSite('UNKNOWN'),'Unknown site')
  assert.match(pretty('2026-10-28'),/28 Oct 2026/)
})
