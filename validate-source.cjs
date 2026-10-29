const fs = require('fs'), path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname,'src');
let count=0, problems=[];
function scan(folder) { for(const entry of fs.readdirSync(folder,{withFileTypes:true})) { const p=path.join(folder,entry.name); if(entry.isDirectory()) scan(p); else if(/\.(jsx|js)$/.test(p)) { count++; const text=fs.readFileSync(p,'utf8'); const sf=ts.createSourceFile(p,text,ts.ScriptTarget.Latest,true,p.endsWith('.jsx')?ts.ScriptKind.JSX:ts.ScriptKind.JS); for (const e of sf.parseDiagnostics) problems.push(`${path.relative(root,p)}: ${ts.flattenDiagnosticMessageText(e.messageText,' ')} at ${e.start}`); for (const m of text.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]|\bimport\s+['"](\.[^'"]+)['"]/g)) { const rel=m[1]||m[2]; const loc=path.resolve(path.dirname(p),rel); if(![loc,loc+'.js',loc+'.jsx',path.join(loc,'index.js'),path.join(loc,'index.jsx')].some(fs.existsSync)) problems.push(`${path.relative(root,p)}: Missing ${rel}`); } } } }
scan(root);
if(problems.length){ process.stderr.write(problems.join('\n')+'\n'); process.exitCode=1; } else console.log(`${count} JavaScript/JSX source files parsed with TypeScript; all local relative imports resolved.`);
