import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'});
for(const key of ['window','document','DOMParser','Node','HTMLElement','Element','MutationObserver','getComputedStyle'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);globalThis.cancelAnimationFrame=clearTimeout;
const {sanitizeRichText}=await import('../src/features/templates/richText.js');
const {Editor}=await import('@tiptap/core');
const {documentExtensions}=await import('../src/features/templates/documentExtensions.js');
const {getHxcSchema}=await import('../src/features/templates/hxcSchema.js');
const {getReportConfig}=await import('../src/features/templates/hxcReportConfig.js');
const {schemaToDocument}=await import('../src/features/templates/hxcDocumentModel.js');

test('Imported HTML rejects executable markup, unsafe links and remote images while retaining supported formatting',()=>{
 const html=sanitizeRichText('<p onclick="alert(1)" style="color:red;position:fixed;background-image:url(https://tracker.invalid)"><strong>Safe</strong><a href="javascript:alert(1)">Link</a><img src="https://tracker.invalid/p.png"><script>alert(1)</script><iframe src="https://bad.invalid"></iframe></p>');
 assert.match(html,/<strong>Safe<\/strong>/);assert.doesNotMatch(html,/onclick|javascript:|<script|<iframe|position:|url\(/);assert.match(html,/External image omitted/);
 const semantic=sanitizeRichText('<div data-hxc-node="hxcComplianceField" data-field-id="stolen"><p>Text</p></div>');assert.doesNotMatch(semantic,/data-hxc-node|data-field-id/);
});
test('ProseMirror formatting preserves HXC identity; ordinary deletion cannot erase a protected question',()=>{
 const editor=new Editor({extensions:documentExtensions(),content:schemaToDocument(getHxcSchema(null),getReportConfig({}))});
 let pos,node;editor.state.doc.descendants((n,p)=>{if(pos===undefined&&n.type.name==='hxcComplianceField'){pos=p;node=n;}});
 editor.commands.setTextSelection({from:pos+2,to:pos+node.nodeSize-2});editor.commands.toggleBold();assert.ok(editor.isActive('bold'));
 assert.equal(editor.state.doc.nodeAt(pos).attrs.fieldId,'hxc-1.1');
 const before=editor.state.doc.content.size;editor.view.dispatch(editor.state.tr.delete(pos,pos+node.nodeSize));assert.equal(editor.state.doc.content.size,before);
 editor.view.dispatch(editor.state.tr.delete(pos,pos+editor.state.doc.nodeAt(pos).nodeSize).setMeta('hxcStructure',true));assert.notEqual(editor.state.doc.nodeAt(pos).attrs.fieldId,'hxc-1.1');
 editor.destroy();
});
