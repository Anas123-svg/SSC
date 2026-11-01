import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {browserOptions} from './browserHarness.mjs';
const browser=await chromium.launch(browserOptions());
const context=await browser.newContext({viewport:{width:1600,height:1100},acceptDownloads:true,serviceWorkers:'block'});
const page=await context.newPage(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.HXC_TEST_URL||'http://127.0.0.1:5181';
const record=(name,data={})=>{results.push({name,...data});console.log('PASS',name,JSON.stringify(data));};
const open=async()=>{await page.goto(base+'/#/admin/templates');await page.getByRole('button',{name:'Open HXC Audit template'}).click();await page.locator('.hxc-editable').waitFor();};
const selectText=async locator=>{await locator.click({clickCount:3});};
try{
 await open();
 await page.waitForFunction(()=>document.querySelector('.hxword-status')?.textContent.includes('printable pages'));
 assert.equal(await page.locator('.hxc-editable [data-hxc-section]').count(),10);assert.equal(await page.locator('.hxc-editable [data-field-id]').count(),65);
 await page.screenshot({path:'artifacts/hxc-editor/editor.png',fullPage:true});record('Admin loads every HXC section and requirement');
 // Seed a historical record in this isolated test browser only.
 const historical=await page.evaluate(async()=>{const {getHxcSchema}=await import('/src/features/templates/hxcSchema.js');const {getReportConfig}=await import('/src/features/templates/hxcReportConfig.js');const db=JSON.parse(localStorage.getItem('ssc-workspace-db-v1'));const schema=getHxcSchema(db.templates[0]);const record={id:'hxc-test-history',templateId:'hxc',workspaceId:'harmonix',projectName:'Historical test inspection',date:'2026-10-20',status:'Completed',schemaSnapshot:schema,reportConfigSnapshot:getReportConfig(db.templates[0]),answers:{[schema[0].blocks[0].id]:'MA',[schema[0].blocks[0].id+':evidence']:'Historical evidence'}};db.audits.push(record);localStorage.setItem('ssc-workspace-db-v1',JSON.stringify(db));return JSON.stringify(record);});
 await page.reload();await page.getByRole('button',{name:'Open HXC Audit template'}).click();
 const first=page.locator('.hxc-editable .hxcComplianceField').first(),id=await first.getAttribute('data-field-id'),label=first.locator('.hxc-label p').first();
 await selectText(label);await page.keyboard.insertText('Verified requirement with stable field ID.');await selectText(label);
 await page.getByRole('button',{name:'Bold',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Bold',exact:true}).getAttribute('aria-pressed'),'true');assert.match(await label.innerHTML(),/<strong>/);
 await page.getByLabel('Font size',{exact:true}).selectOption('12pt');assert.match(await label.innerHTML(),/font-size: 12pt/);
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('All changes saved. New inspections').waitFor();
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ssc-workspace-db-v1')));
 assert.equal(saved.templates[0].schema[0].blocks[0].id,id);assert.equal(saved.templates[0].schema[0].blocks[0].label,'Verified requirement with stable field ID.');assert.equal(JSON.stringify(saved.audits.find(r=>r.id==='hxc-test-history')),historical);
 await page.reload();await page.getByRole('button',{name:'Open HXC Audit template'}).click();assert.equal(await page.locator(`.hxc-editable [data-field-id="${id}"] .hxc-label`).innerText(),'Verified requirement with stable field ID.');record('Formatting, save, reload, stable IDs and historical data');
 await page.getByRole('tab',{name:'Fields & structure',exact:true}).click();await page.getByLabel('Section title',{exact:true}).fill('Updated site presentation');await page.getByRole('tab',{name:'Document editor',exact:true}).click();assert.equal(await page.locator('.hxc-editable [data-hxc-section]').first().innerText(),'Updated site presentation');assert.equal(await page.locator(`.hxc-editable [data-field-id="${id}"] .hxc-label`).innerText(),'Verified requirement with stable field ID.');
 await page.getByRole('button',{name:'Duplicate section',exact:true}).click();assert.equal(await page.locator('.hxc-editable [data-hxc-section]').count(),11);await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await page.locator('.hxc-editable [data-hxc-section]').count(),10);record('Advanced builder round trip and section duplication undo');
 await page.locator('.hxword-outline-list button').first().click();await page.getByRole('tab',{name:'Insert',exact:true}).click();await page.getByRole('button',{name:'Paragraph',exact:true}).click();await page.keyboard.insertText('Inserted narrative paragraph for document verification.');
 const dialogs=['3','2'];const tableDialog=dialog=>dialog.accept(dialogs.shift());page.on('dialog',tableDialog);await page.getByRole('button',{name:'Table',exact:true}).click();page.off('dialog',tableDialog);
 assert.ok(await page.locator('.hxc-editable table').count()>5);
 await page.getByRole('tab',{name:'Table Layout',exact:true}).click();await page.getByRole('button',{name:'Row below',exact:true}).click();
 await page.getByRole('tab',{name:'Insert',exact:true}).click();await page.getByRole('button',{name:'Paragraph',exact:true}).click();
 await page.locator('input[type=file][accept^="image/"]').setInputFiles('public/ssc-logo-transparent.png');await page.locator('.hxc-editable img[alt="ssc-logo-transparent.png"]').waitFor();
 await page.getByRole('button',{name:'Save',exact:true}).click();record('Insert paragraph, resizeable table, row and image');
 await page.getByRole('tab',{name:'Layout',exact:true}).click();await page.getByLabel('Page orientation',{exact:true}).selectOption('landscape');assert.ok((await page.locator('.hxword-sheet').boundingBox()).width>1100);
 await page.getByRole('button',{name:'Preview',exact:true}).click();await page.locator('.hxc-preview-stage .hxc-print-page').first().waitFor();
 let count=await page.locator('.hxc-preview-stage .hxc-print-page').count();assert.ok(count>1);assert.equal(await page.locator('.hxc-preview-stage [data-field-id]').count(),65);
 assert.ok(await page.locator('.hxc-preview-stage').getByText('Inserted narrative paragraph for document verification.').count());assert.ok(await page.locator('.hxc-preview-stage img[alt="ssc-logo-transparent.png"]').count());
 const overflow=await page.locator('.hxc-print-page').evaluateAll(pages=>pages.map((p,i)=>({page:i+1,bottom:p.querySelector('.hxc-page-body').getBoundingClientRect().bottom,limit:p.getBoundingClientRect().bottom-parseFloat(getComputedStyle(p).paddingBottom)*.8})).filter(p=>p.bottom>p.limit+2));assert.deepEqual(overflow,[]);
 await page.screenshot({path:'artifacts/hxc-editor/preview.png',fullPage:true});record('All preview pages, landscape dimensions, row boundaries',{pages:count});
 await page.getByLabel('Page view',{exact:true}).selectOption('two');await page.getByRole('button',{name:'Fit width',exact:true}).click();assert.equal(await page.locator('.hxc-preview-stage .hxc-print-page').count(),2);await page.screenshot({path:'artifacts/hxc-editor/two-page.png',fullPage:true});
 await page.getByLabel('Preview data',{exact:true}).selectOption('hxc-test-history');await page.locator('[data-compliance="MA"]').first().waitFor();assert.equal(await page.locator('.hxc-preview-stage [data-compliance="MA"]').first().innerText(),'MA');record('Two-page mode and historical inspection snapshot preview');
 await page.getByLabel('Preview data',{exact:true}).selectOption('');await page.getByRole('button',{name:'Return to editor',exact:true}).click();
 await page.getByRole('tab',{name:'File',exact:true}).click();
 for(const [label,name] of [['Export HTML','hxc-audit.html'],['Export DOCX','hxc-audit.docx']]){const downloadPromise=page.waitForEvent('download',{timeout:60000});await page.getByRole('button',{name:label,exact:true}).click();const download=await downloadPromise;await download.saveAs('artifacts/hxc-editor/'+name);}
 const zipModule=await import('jszip');const zip=await zipModule.default.loadAsync(await readFile('artifacts/hxc-editor/hxc-audit.docx'));assert.ok(zip.file('word/document.xml'));assert.ok(zip.file('customXml/hxc-template.xml'));assert.match(await zip.file('word/document.xml').async('string'),/Verified requirement/);record('Real DOCX package, metadata and HTML export');
 // Import conversion appends content by default; the original field IDs stay intact.
 page.once('dialog',d=>d.dismiss());await page.locator('input[type=file][accept=".docx"]').setInputFiles('artifacts/hxc-editor/hxc-audit.docx');await page.getByText(/DOCX conversion preserves supported/).waitFor();assert.equal(await page.locator('.hxc-editable .hxcComplianceField').count(),65);record('DOCX conversion warning and safe append import');
 await page.getByRole('button',{name:'Undo',exact:true}).click();
 await page.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.dataset.workspace='harmonix';});await page.getByRole('tab',{name:'Home',exact:true}).click();
 assert.equal(await page.locator('.hxword-sheet').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');await page.screenshot({path:'artifacts/hxc-editor/dark.png',fullPage:true});record('Dark chrome with white paper');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/hxc-editor/mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));record('Mobile has no app-level horizontal overflow');
 const readonly=await context.newPage();await readonly.goto(base+'/tests/browser/fixture.html');await readonly.locator('.hxc-preview-stage .hxc-print-page').first().waitFor();assert.equal(await readonly.locator('.hxc-preview-stage [data-field-id]').count(),65);assert.ok(await readonly.getByRole('button',{name:'Save',exact:true}).isDisabled());assert.equal(await readonly.locator('[contenteditable=true]').count(),0);await readonly.screenshot({path:'artifacts/hxc-editor/read-only.png',fullPage:true});record('Read-only component uses full preview and disables editing');
 assert.deepEqual(errors,[]);record('No client-side exceptions');
 await writeFile('artifacts/hxc-editor/browser-results.json',JSON.stringify({results,errors},null,2));
} catch(e){await page.screenshot({path:'artifacts/hxc-editor/failure.png',fullPage:true});console.error(e);process.exitCode=1;} finally {await browser.close();}





