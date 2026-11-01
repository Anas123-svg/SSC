import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
const server = await createServer({ server: { host: '127.0.0.1', port: 5183, strictPort: true }, optimizeDeps: { include: ['docx','mammoth/mammoth.browser','jszip'] } });
await mkdir('artifacts/hxc-editor', { recursive: true });
try {
  await server.listen();
  for (const script of ['tests/browser/hxc-editor.mjs','tests/browser/hxc-print.mjs']) {
    const code = await new Promise((resolve,reject) => { const child = spawn(process.execPath, [script], { stdio: 'inherit', windowsHide: true, env: { ...process.env, HXC_TEST_URL: 'http://127.0.0.1:5183' } }); child.on('exit',resolve); child.on('error',reject); });
    if (code) { process.exitCode = code; break; }
  }
} finally { await server.close(); }
