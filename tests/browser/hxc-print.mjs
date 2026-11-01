import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {browserOptions} from './browserHarness.mjs';
const browser=await chromium.launch(browserOptions());
const page=await browser.newPage({viewport:{width:1500,height:1000}});
const base=process.env.HXC_TEST_URL||'http://127.0.0.1:5181';
try{
 await page.goto(base+'/#/admin/templates');await page.getByRole('button',{name:'Open HXC Audit template'}).click();await page.getByRole('tab',{name:'Layout',exact:true}).click();await page.getByLabel('Page orientation',{exact:true}).selectOption('landscape');
 await page.getByLabel('Page margins',{exact:true}).selectOption('custom');await page.getByLabel('left margin mm',{exact:true}).fill('18');await page.getByLabel('right margin mm',{exact:true}).fill('18');
 await page.evaluate(()=>{new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.tagName==='IFRAME')n.contentWindow.print=()=>{n.dataset.printCalled='true';};}).observe(document.body,{childList:true});});
 await page.getByRole('button',{name:'Print',exact:true}).click();
 const frame=page.frameLocator('iframe[title="HXC print document"]');await frame.locator('.hxc-print-page').first().waitFor();await page.locator('iframe[data-print-called=true]').waitFor();
 assert.ok(await frame.locator('img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)));
 const source=await frame.locator('html').evaluate(el=>el.outerHTML),count=await frame.locator('.hxc-print-page').count();assert.ok(count>1);assert.equal(await frame.locator('.hxword-ribbon,.sidebar,.hxword-titlebar').count(),0);
 const output=await browser.newPage();await output.setContent(source);await output.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
 await output.pdf({path:'artifacts/hxc-editor/print-landscape.pdf',printBackground:true,preferCSSPageSize:true});
 const dimensions=await output.locator('.hxc-print-page').first().evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,left:getComputedStyle(el).paddingLeft,right:getComputedStyle(el).paddingRight}));assert.ok(dimensions.width>dimensions.height);
 await output.screenshot({path:'artifacts/hxc-editor/print-page.png',fullPage:false});
 await writeFile('artifacts/hxc-editor/print-results.json',JSON.stringify({count,dimensions,chromeElements:0,printCalled:true},null,2));console.log('PASS isolated print/PDF pipeline',JSON.stringify({count,dimensions}));
}finally{await browser.close();}

